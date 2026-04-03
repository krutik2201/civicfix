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
- **React Router** – client‑side routing (pages: Home, Login, Register, Profile, AdminDashboard, UserApp)
- **Authentication context** – Firebase Auth integration (sign up, sign in, protected routes)
- **Toast notifications** – global feedback system
- **File upload UI** – for submitting issue reports with images
- **Admin dashboard** – view and manage reported issues (status badges, tables)
- **Public assets** – logo, robots.txt
- 
