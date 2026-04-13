# 🏙️ CivicFix: AI-Driven Smart City Infrastructure Management

CivicFix is a smart city platform that allows citizens to report infrastructure issues using AI-powered image analysis and enables administrators to monitor, assign, and resolve them efficiently through a centralized dashboard.

The system uses Google Gemini AI to analyze uploaded images, classify issues (like potholes, streetlights, drainage), and assign a severity score (1–10). It also provides real-time visualization using maps and analytics dashboards.

---

## 🌐 Live Demo

- **Hosted Frontend:** [https://civicfix-frontend-nykz.onrender.com](https://civicfix-frontend-nykz.onrender.com)
- **Hosted Backend API:** [https://civicfix-hackfest.onrender.com/docs](https://civicfix-hackfest.onrender.com/docs)

---

## 🚀 Features

- AI-powered issue detection using image upload
- Severity scoring and categorization via Gemini AI
- Interactive map dashboard using React-Leaflet
- Admin analytics dashboard (Recharts)
- Contractor assignment system
- Citizen feedback and rating system

---

## 🔐 Demo Login Credentials

- Citizen → Email: citizen@gmail.com | Password: user123  
- Admin → Email: admin@city.gov | Password: admin123  
- Contractor → Email: contractor@gmail.com | Password: con123  

---

## 🛠️ Tech Stack

Frontend uses React 18 with Vite, Tailwind CSS for styling, React Router for navigation, React-Leaflet and Leaflet for maps, Recharts for analytics, Firebase for authentication and database, Axios for API calls, and Framer Motion for UI animations.

Backend is built with Python using FastAPI and Uvicorn, integrated with Firebase Admin SDK, Google Gemini AI (google-genai), Cloudinary for image storage, Pillow for image processing, and Pydantic for validation.

---

## 📦 Dependencies

Backend dependencies (install via pip):

fastapi  
uvicorn  
firebase-admin  
google-genai  
python-dotenv  
cloudinary  
pillow  
pydantic  
python-multipart  

Install command:
pip install fastapi uvicorn firebase-admin google-genai python-dotenv cloudinary pillow pydantic python-multipart  

Frontend dependencies (installed via package.json):

react  
react-dom  
react-router-dom  
axios  
firebase  
leaflet  
react-leaflet  
recharts  
framer-motion  
tailwindcss  
react-icons  
lucide-react  
@react-google-maps/api  
react-google-recaptcha  

Install command:
npm install  

---

## ⚙️ Setup & Run

Clone the repository:

git clone https://github.com/krutik2201/civicfix
cd civicfix-hackfest  

---

Backend setup:

cd backend  

python -m venv venv  
venv\Scripts\activate   (Windows)  
# source venv/bin/activate (Mac/Linux)  

Install dependencies:

pip install fastapi uvicorn firebase-admin google-genai python-dotenv cloudinary pillow pydantic python-multipart  

Create a `.env` file inside backend folder:

GEMINI_API_KEY=your_google_gemini_key  
CLOUDINARY_CLOUD_NAME=your_cloudinary_name  
CLOUDINARY_API_KEY=your_cloudinary_api_key  
CLOUDINARY_API_SECRET=your_cloudinary_secret

Add Firebase Admin SDK file:

backend/firebase_credentials.json  

Run backend:

python main.py  

Backend runs on:
http://localhost:9090  
Docs:
http://localhost:9090/docs  

---

Frontend setup:

cd frontend  

npm install  

Create a `.env` file inside frontend folder:

VITE_FIREBASE_API_KEY=your_api_key  
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain  
VITE_FIREBASE_PROJECT_ID=your_project_id  
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket  
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id  
VITE_FIREBASE_APP_ID=your_app_id  
VITE_BACKEND_URL=http://localhost:9090  

Run frontend:

npm run dev  

Frontend runs on:
http://localhost:5173  

---

## 🔐 Role-Based Access

Citizen can report issues, view their history, and give feedback.  
Contractor can view assigned tasks and update status.  
Admin has full control including assigning tasks, monitoring analytics, and managing issues.

---

## 📌 Notes

- Firebase project must be properly configured  
- Cloudinary is required for image uploads  
- Gemini API key is required for AI functionality  
- This project is a hackathon prototype, not production-ready  

---

## 🏁 Project Status

Core features implemented with working prototype. Limited scalability, no production-grade security, and no payment system included.

---

## 👨‍💻 Built For

CivicFix Hackathon Project
