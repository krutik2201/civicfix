# 🏙️ CivicFix: AI-Driven Smart City Infrastructure Management

CivicFix is a next-generation smart city platform designed to continuously monitor, report, and maintain public infrastructure. By combining real-time citizen crowdsourcing with **Google Gemini AI** and detailed geospatial mapping, CivicFix gives municipal administrators a powerful, automated toolkit to ensure city safety.

## 🚀 Features

- **🤖 AI-Powered Incident Reporting:** Citizens snap photos of broken infrastructure. Gemini AI instantly analyzes the image to determine the category (e.g., Streetlight, Pothole, Drainage) and assigns a **Severity Score (1-10)** to prioritize the danger.
- **🗺️ Interactive Map Dashboard:** Real-time localization of all active issues using React-Leaflet, allowing Admins to deploy resources efficiently.
- **📊 Real-time Analytics & Triage:** Built-in dashboard visualizes issue severity distributions, top categorization, and fix-rate tracking using Recharts.
- **👷 Contractor Assignment:** Administrators intuitively dispatch verified work orders directly to registered city contractors.
- **⭐ Citizen Feedback Loop:** Upon issue resolution, citizens are notified and can submit a 1-5 Star satisfaction rating and feedback to ensure contractor accountability.

---

## 🛠️ Technology Stack

**Frontend Framework:** React 18, Vite, Vite Plugin React
**Styling & UI:** Tailwind CSS, React Icons, Recharts (Analytics)
**Mapping:** React-Leaflet
**Backend API:** Python, FastAPI, Uvicorn
**Artificial Intelligence:** Google GenAI (Gemini 2.5 Flash)
**Database & Auth:** Firebase / Google Cloud Firestore, Firebase Authentication
**Media Storage:** Cloudinary

---

## 💻 Running the Project Locally

Follow these steps to deploy CivicFix on your local development server.

### 1. Clone the Repository
```bash
git clone <your-repo-link>
cd civicfix-hackfest
```

### 2. Configure the Backend (FastAPI)

The backend service connects to Firebase, processes images via Cloudinary, and analyzes them with Gemini.

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment (Optional but Recommended)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS / Linux

# Install Python dependencies
pip install fastapi uvicorn firebase-admin google-genai python-dotenv cloudinary pillow pydantic

# Set up Environment Variables
# Create a `.env` file in the backend directory with the following keys:
# GEMINI_API_KEY=your_google_gemini_key
# CLOUDINARY_CLOUD_NAME=your_cloudinary_name
# CLOUDINARY_API_KEY=your_cloudinary_api
# CLOUDINARY_API_SECRET=your_cloudinary_secret
# ADMIN_SECRET_KEY=hackathon_admin_123
```

**⚠️ Important Firebase Configuration:**
You must place your Firebase Admin SDK credential file inside the `backend` directory and name it `firebase_credentials.json`. 

```bash
# Start the Backend Server (Runs on port 9090)
python main.py
```

### 3. Configure the Frontend (React + Vite)

The frontend handles the Citizen Portal, Contractor App, and Admin Control Center.

```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Set up Environment Variables
# Create a `.env` file in the frontend directory with your Firebase Web config:
# VITE_FIREBASE_API_KEY=your_api_key
# VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
# VITE_FIREBASE_PROJECT_ID=your_project_id
# VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
# VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
# VITE_FIREBASE_APP_ID=your_app_id
# VITE_BACKEND_URL=http://localhost:9090

# Start the Frontend Development Server
npm run dev
```

### 4. Access the Application

- **Frontend Application:** Click the local link provided by Vite (usually `http://localhost:5173` or `http://localhost:5174`)
- **Backend API Docs:** Navigate to `http://localhost:9090/docs` to view the interactive Swagger OpenAPI documentation.

---

## 🔐 Accounts & Roles

CivicFix utilizes role-based access control. When authenticating:
- **Citizens:** Can report issues, view their own issue history, and leave feedback.
- **Contractors:** View assigned pipelines and resolve active tickets.
- **Admins:** Full god-view of the platform, including assignment and permanent deletion rights. *Note: The Admin UI is seamlessly unified; valid Admins log in normally and are auto-routed to the Control Center.*

---
*Built for the CivicFix Hackfest.*
