# CivicFix – Community Issue Reporting Platform

A full‑stack web application that allows citizens to report local civic issues (potholes, broken streetlights, garbage piles, etc.) and enables administrators to track and resolve them. Built for the **Civic Hackfest 2026**.

## 📌 Features Implemented (as of April 4, 2026)

### Backend
- **FastAPI** server with a single entry point (`main.py`)
- **Requirements** defined – FastAPI, Uvicorn, Google GenAI, Firebase Admin, Pydantic, Cloudinary
- **Firestore security rules** – basic structure for storing reports and user data

### Frontend
- **React 18 + Vite** – fast development and build tooling
- **Tailwind CSS** + PostCSS – utility‑first styling



```
civicfix
├─ backend
│  ├─ main.py
│  └─ requirements.txt
├─ frontend
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ public
│  │  └─ logo.png
│  ├─ README.md
│  ├─ src
│  │  ├─ App.css
│  │  ├─ App.jsx
│  │  ├─ auth
│  │  │  └─ ProtectedRoute.jsx
│  │  ├─ components
│  │  │  ├─ admin
│  │  │  │  ├─ DashboardStats.jsx
│  │  │  │  ├─ ReportTable.jsx
│  │  │  │  └─ StatusBadge.jsx
│  │  │  ├─ layout
│  │  │  │  ├─ AdminLayout.jsx
│  │  │  │  ├─ Layout.jsx
│  │  │  │  └─ UserLayout.jsx
│  │  │  └─ user
│  │  │     ├─ LoadingSequence.jsx
│  │  │     ├─ ReportUpload.jsx
│  │  │     └─ ResultCard.jsx
│  │  ├─ contexts
│  │  │  ├─ AuthContext.jsx
│  │  │  └─ ToastContext.jsx
│  │  ├─ firebase
│  │  │  └─ config.js
│  │  ├─ index.css
│  │  ├─ main.jsx
│  │  ├─ pages
│  │  │  ├─ AdminDashboard.jsx
│  │  │  ├─ Home.jsx
│  │  │  ├─ Login.jsx
│  │  │  ├─ Profile.jsx
│  │  │  ├─ Register.jsx
│  │  │  └─ UserApp.jsx
│  │  ├─ services
│  │  │  ├─ api.js
│  │  │  └─ firebaseService.js
│  │  ├─ shared
│  │  │  ├─ Footer.jsx
│  │  │  ├─ Header.jsx
│  │  │  └─ Toast.jsx
│  │  └─ utils
│  │     └─ constants.js
│  ├─ tailwind.config.js
│  └─ vite.config.js
└─ README.md

```