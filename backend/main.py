import os
import json
import uvicorn
import io
import logging
import random
import time
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timedelta, timezone
from enum import Enum

# Third-party imports
from fastapi import FastAPI, UploadFile, HTTPException, Query, Form, File, status, Body, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, EmailStr
import cloudinary
import cloudinary.uploader

# Google GenAI imports
from google import genai
from google.genai import types

# Image processing
from PIL import Image

# Firebase imports
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# ==========================================
# 1. CONFIGURATION & SETUP
# ==========================================

# Load environment variables
load_dotenv()

# Configure Cloudinary
cloudinary.config(
  cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
  api_key = os.getenv('CLOUDINARY_API_KEY'),
  api_secret = os.getenv('CLOUDINARY_API_SECRET')
)

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("CivicFixAPI")

# Initialize FastAPI App
app = FastAPI(
    title="CivicFix AI API",
    description="Backend for Smart City Infrastructure Reporting System",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 2. DATABASE & AI CLIENT INITIALIZATION
# ==========================================

# Initialize Firebase Firestore
db = None
try:
    if os.path.exists("firebase_credentials.json"):
        cred = credentials.Certificate("firebase_credentials.json")
        try:
            firebase_admin.get_app()
        except ValueError:
            firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        logger.info("✅ Firebase Firestore Connected Successfully")
    else:
        logger.warning("⚠️ firebase_credentials.json not found! Database features will fail.")
except Exception as e:
    logger.error(f"❌ Firebase Connection Failed: {str(e)}")

# Initialize Google Gemini AI
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
client = None

if GEMINI_KEY:
    try:
        client = genai.Client(api_key=GEMINI_KEY)
        logger.info(f"✅ Gemini AI Client Initialized (Key ends in ...{GEMINI_KEY[-4:]})")
    except Exception as e:
        logger.error(f"❌ Gemini Client Initialization Failed: {e}")
        client = None
else:
    logger.warning("⚠️ GEMINI_API_KEY not found in .env file. AI features will be disabled.")

# ==========================================
# 3. AI SYSTEM PROMPTS
# ==========================================

SYSTEM_PROMPT = """
You are an expert civil engineer and city infrastructure auditor.
Your job is to analyze images submitted by citizens to identify infrastructure damage or civic issues.

Input: An image of a street, road, or public area.
Output: A strict JSON object.

Required JSON Structure without any comments:
{
    "is_valid": boolean, 
    "rejection_reason": "string (use empty string if none)", 
    "category": "Road/Pothole" | "Water/Sanitation" | "Streetlight/Electrical" | "Public Building Damage",
    "severity_score": integer, 
    "estimated_cost_inr": integer
}

Visual Recognition & Anti-Spoofing Rules:
1. **AI/Fake Image Detection (PRIORITY 1):** Check for unnatural smoothness, cartoonish textures, impossible physics, or "hyper-realistic" AI artifacts. If the image looks AI-generated, is a video game screenshot, or depicts impossible events (like nuclear explosions):
   - Set "is_valid": false
   - Set "rejection_reason": "Image detected as AI-generated or manipulated content."
   - Set "category": "Road/Pothole" (fallback)
   - Set "severity_score": 1
   - Set "estimated_cost_inr": 0

2. **Taxonomy Constraint:** You MUST categorize the issue strictly into one of: ["Road/Pothole", "Water/Sanitation", "Streetlight/Electrical", "Public Building Damage"].

3. **Severity:** Assign a severity score from 1 to 10 (10 being extreme danger).
4. **Estimation:** Provide a rough estimated repair cost in INR based on visible damage. If not valid, set to 0.
"""

# ==========================================
# 4. DATA MODELS
# ==========================================

class StatusUpdate(BaseModel):
    status: str

class AssignUpdate(BaseModel):
    contractor_id: str

class AIAnalysisResult(BaseModel):
    is_valid: bool
    rejection_reason: str
    category: str
    severity_score: int
    estimated_cost_inr: int

class AIContractorVerificationResult(BaseModel):
    is_valid: bool
    rejection_reason: str

# ==========================================
# 5. UTILITY FUNCTIONS
# ==========================================

def clean_json_response(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

# ==========================================
# 6. API ENDPOINTS
# ==========================================

@app.get("/", tags=["General"])
async def root():
    return {"status": "Running", "version": "2.0.0"}

@app.post("/analyze-image", tags=["AI Processing"])
async def analyze_image(
    file: UploadFile = File(...),
    user_id: str = Form(...), 
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None)
):
    """
    Analyzes an image using Google Gemini.
    Includes:
    1. Anti-Spoofing Checks
    2. Rate Limiting (Max 5 reports per user per day) - Fixed for Timezones
    """
    start_time = time.time()
    
    # --- 🛡️ RATE LIMIT CHECK (Fixed Timezone Logic) ---
    if db:
        try:
            # ⭐ USE UTC DATE (matches Frontend's .toISOString())
            today_prefix = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            
            # Simple Query: Get ALL reports by this User
            # ⭐ FIX: Removed .limit(50) so we count EVERYTHING from today correctly
            docs = db.collection("reports") \
                .where("userId", "==", user_id) \
                .stream()
            
            daily_count = 0
            for doc in docs:
                data = doc.to_dict()
                timestamp = data.get("timestamp", "") # Frontend saves ISO string
                # Check if report date matches today (UTC)
                if timestamp.startswith(today_prefix):
                    daily_count += 1
            
            # Debug Print (Check your terminal to see this!)
            print(f"🔍 DEBUG: User {user_id} | Today(UTC): {today_prefix} | Count: {daily_count}")

            if daily_count >= 5:
                logger.warning(f"⛔ Rate Limit Exceeded for {user_id}")
                return JSONResponse(
                    status_code=429, 
                    content={"detail": f"Daily limit reached ({daily_count}/5). Please try again tomorrow."}
                )

        except Exception as e:
            logger.error(f"Rate limit check error: {e}")

    logger.info(f"📸 Received image analysis request: {file.filename}")

    if not file.content_type.startswith("image/"):
        raise HTTPException(400, detail="File must be an image")
    
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(500, "Failed to process uploaded file")

    # ☁️ CLOUDINARY UPLOAD
    image_url = None
    try:
        logger.info("☁️ Uploading image to Cloudinary...")
        upload_result = cloudinary.uploader.upload(content, folder="civicfix_reports")
        image_url = upload_result.get("secure_url")
        logger.info(f"✅ Image uploaded to Cloudinary: {image_url}")
    except Exception as e:
        logger.error(f"❌ Cloudinary Upload Failed: {e}")

    ai_result = {}

    if client:
        try:
            user_message = types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text="Analyze this city infrastructure image according to the system instructions."),
                    types.Part.from_bytes(data=content, mime_type=file.content_type)
                ]
            )

            logger.info("🤖 Sending request to Gemini 2.5 Flash...")
            response = client.models.generate_content(
                model="gemini-2.5-flash", 
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.4, 
                    response_mime_type="application/json",
                    response_schema=AIAnalysisResult,
                    safety_settings=[
                        types.SafetySetting(
                            category="HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold="BLOCK_NONE",
                        ),
                        types.SafetySetting(
                            category="HARM_CATEGORY_HARASSMENT",
                            threshold="BLOCK_NONE",
                        ),
                        types.SafetySetting(
                            category="HARM_CATEGORY_HATE_SPEECH",
                            threshold="BLOCK_NONE",
                        ),
                        types.SafetySetting(
                            category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold="BLOCK_NONE",
                        ),
                    ]
                ),
                contents=[user_message]
            )

            logger.info("Raw AI Output: %s", response.text)
            if response.candidates:
                logger.info("Finish Reason: %s", response.candidates[0].finish_reason)
            json_text = clean_json_response(response.text)
            ai_result = json.loads(json_text)

            # 🛡️ SAFETY OVERRIDE
            if not ai_result.get("is_valid", True) or ai_result.get("rejection_reason"):
                logger.warning("⚠️ Fake/AI Image Detected! Overriding severity.")
                ai_result["severity_score"] = 1
                ai_result["rejection_reason"] = ai_result.get("rejection_reason") or "System detected AI-generated or manipulated imagery."
                ai_result["is_valid"] = False
            
            logger.info(f"✅ AI Analysis Complete. Category: {ai_result.get('category')}")

        except Exception as e:
            logger.error(f"❌ AI Error: {e}")
            ai_result = {
                "is_valid": False, 
                "rejection_reason": "AI Server Overloaded or Error: " + str(e), 
                "category": "Road/Pothole",  # Fallback
                "severity_score": 1,
                "estimated_cost_inr": 0
            }
    else:
        ai_result = {"issue_detected": False, "message": "AI service unavailable."}

    # 🌟 ALWAYS attach the Cloudinary image, regardless of AI success/failure! 🌟
    if image_url:
        ai_result["imageUrl"] = image_url

    process_time = time.time() - start_time
    
    return {
        "status": "success",
        "processing_time_seconds": round(process_time, 2),
        "data": ai_result
    }

# --- CONTRACTOR ENDPOINTS ---

@app.get("/contractor/jobs", tags=["Contractor Processing"])
async def get_active_jobs(uid: Optional[str] = Query(None)):
    """Fetches assigned jobs for a specific contractor, bypassing Firebase client rules."""
    if not db: raise HTTPException(503, "Database not connected")
    
    docs = db.collection("reports").stream()
    jobs = []
    allowed_statuses = ["In-Progress", "IN_PROGRESS", "Pending Verification", "RESOLVED"]
    
    for doc in docs:
        d = doc.to_dict()
        # If uid is provided, ONLY return jobs explicitly assigned to them.
        if uid and d.get("assigned_to") != uid:
            continue
            
        if d.get("status") in allowed_statuses:
            jobs.append({**d, "id": doc.id})
            
    # Sort in Python
    def get_date(r):
        return r.get("timestamp") or r.get("createdAt") or ""
        
    jobs.sort(key=get_date, reverse=True)
    return {"jobs": jobs}

@app.post("/contractor/resolve/{report_id}", tags=["Contractor Processing"])
async def resolve_issue(
    report_id: str,
    file: UploadFile = File(...)
):
    """
    Accepts an After photo for a report_id. Uses Gemini to verify. Updates Firestore.
    """
    if not db:
        raise HTTPException(503, "Database not connected")
    
    logger.info(f"📸 Received After photo for report {report_id}")

    if not file.content_type.startswith("image/"):
        raise HTTPException(400, detail="File must be an image")
    
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(500, "Failed to process uploaded file")

    # Cloudinary Upload
    image_url = None
    try:
        logger.info("☁️ Uploading After image to Cloudinary...")
        upload_result = cloudinary.uploader.upload(content, folder="civicfix_after_photos")
        image_url = upload_result.get("secure_url")
        logger.info(f"✅ After image uploaded to Cloudinary: {image_url}")
    except Exception as e:
        logger.error(f"❌ Cloudinary Upload Failed: {e}")
        raise HTTPException(500, "Failed to upload image to storage")

    ai_result = {"is_valid": True, "rejection_reason": ""}

    if client:
        try:
            CONTRACTOR_PROMPT = 'You are an AI Anti-Spoofing Agent. Verify this image shows a completed repair or construction work. Reject AI-generated or irrelevant images. Return JSON: { "is_valid": boolean, "rejection_reason": "string (use empty string if none)" }.'
            
            user_message = types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text="Analyze this 'After' photo for work verification."),
                    types.Part.from_bytes(data=content, mime_type=file.content_type)
                ]
            )

            logger.info("🤖 Sending verification request to Gemini...")
            response = client.models.generate_content(
                model="gemini-2.5-flash", 
                config=types.GenerateContentConfig(
                    system_instruction=CONTRACTOR_PROMPT,
                    temperature=0.2, 
                    response_mime_type="application/json",
                    response_schema=AIContractorVerificationResult
                ),
                contents=[user_message]
            )
            json_text = clean_json_response(response.text)
            parsed_result = json.loads(json_text)
            ai_result["is_valid"] = parsed_result.get("is_valid", True)
            ai_result["rejection_reason"] = parsed_result.get("rejection_reason", "")
            
        except Exception as e:
            logger.error(f"❌ AI Verification Error: {e}")
            ai_result = {"is_valid": False, "rejection_reason": "AI Verification Failed. Server Error."}
    
    if not ai_result.get("is_valid"):
        return {
            "status": "rejected",
            "reason": ai_result.get("rejection_reason"),
            "imageUrl": image_url
        }

    # Update Firestore
    try:
        doc_ref = db.collection("reports").document(report_id)
        # Using dot notation to update nested field might require specific syntax in firebase python SDK,
        # safely we can fetch, then update, or just update root level 'after_url' and 'status'
        doc_ref.update({
            "status": "Pending Verification",
            "after_url": image_url, # Storing at root level for safety
            "images.after_url": image_url, # Trying dot notation
        })
        logger.info(f"✅ Report {report_id} updated to Pending Verification")
    except Exception as e:
        logger.error(f"❌ Firestore update failed: {e}")
        raise HTTPException(500, "Failed to update database")
        
    return {
        "status": "success",
        "data": {
            "is_valid": True,
            "after_url": image_url,
        }
    }

@app.patch("/user/reports/{report_id}/feedback", tags=["User Actions"])
async def submit_citizen_feedback(report_id: str, feedback: dict = Body(...)):
    if not db: raise HTTPException(503, "Database not connected")
    
    try:
        db.collection("reports").document(report_id).update({
            "citizen_rating": feedback.get("rating"),
            "citizen_feedback": feedback.get("text", ""),
            "rated_at": datetime.now(timezone.utc).isoformat()
        })
        return {"success": True}
    except Exception as e:
        logger.error(f"Failed to save feedback: {e}")
        raise HTTPException(500, "Failed to update feedback")

# --- ADMIN ENDPOINTS ---

async def verify_admin(x_admin_secret: str = Header(...)):
    if x_admin_secret != os.getenv("ADMIN_SECRET_KEY", "hackathon_admin_123"):
        raise HTTPException(status_code=403, detail="Unauthorized Admin Access")

@app.get("/admin/contractors", dependencies=[Depends(verify_admin)])
async def get_all_contractors():
    if not db: raise HTTPException(503, "Database not connected")
    docs = db.collection("users").where("role", "==", "contractor").stream()
    contractors = [{"id": doc.id, **doc.to_dict()} for doc in docs]
    return {"contractors": contractors}

@app.patch("/admin/reports/{report_id}/assign", dependencies=[Depends(verify_admin)])
async def assign_report(report_id: str, assign_data: AssignUpdate):
    if not db: raise HTTPException(503, "Database not connected")
    db.collection("reports").document(report_id).update({
        "status": "In-Progress",
        "assigned_to": assign_data.contractor_id
    })
    return {"success": True}

@app.get("/admin/reports", dependencies=[Depends(verify_admin)])
async def get_all_reports():
    if not db: raise HTTPException(503, "Database not connected")
    docs = db.collection("reports").stream()
    
    reports = [{**doc.to_dict(), "id": doc.id} for doc in docs]
    
    # Sort in Python to gracefully handle older dummy data that might use different date fields
    def get_date(r):
        return r.get("timestamp") or r.get("created_at") or r.get("createdAt") or ""
        
    reports.sort(key=get_date, reverse=True)
    return {"reports": reports}

@app.patch("/admin/reports/{report_id}", dependencies=[Depends(verify_admin)])
async def update_report_status(report_id: str, update_data: StatusUpdate):
    if not db: raise HTTPException(503, "Database not connected")
    
    update_payload = {"status": update_data.status}
    if update_data.status == "In-Progress":
        from google.cloud import firestore
        update_payload["after_url"] = firestore.DELETE_FIELD
        update_payload["images.after_url"] = firestore.DELETE_FIELD
        
    db.collection("reports").document(report_id).update(update_payload)
    return {"success": True}

@app.delete("/admin/reports/{report_id}", dependencies=[Depends(verify_admin)])
async def delete_report(report_id: str):
    if not db: raise HTTPException(503, "Database not connected")
    db.collection("reports").document(report_id).delete()
    return {"success": True}

# ==========================================
# 7. SERVER START
# ==========================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 9090))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)