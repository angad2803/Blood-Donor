# 🩸 Blood Donation Management System

A comprehensive, real-time blood donation platform that connects donors with recipients, utilizing advanced location matching, real-time communications, and AI assistance.

## 🌟 Key Features

- **Real-Time Matching:** Geolocation-based matching using ArcGIS and Leaflet to find the closest compatible donors.
- **Live Messaging:** Integrated Socket.io for real-time chat between donors and hospitals/recipients.
- **Smart Queues & Notifications:** BullMQ and Redis powered asynchronous background jobs for emails (Nodemailer) and notifications.
- **AI Assistant:** Integrated Google Gemini AI to assist users with queries, platform navigation, and health-related questions.
- **Authentication:** JWT-based secure login, alongside Google OAuth (Passport.js).
- **Modern UI/UX:** Built with React, Vite, Tailwind CSS, Chakra UI, and smooth GSAP animations using an aesthetic glassmorphism design.
- **Admin Dashboard:** Comprehensive tools for managing users, requests, and system queues (via Bull Board).

---

## 🛠️ Tech Stack

### **Frontend (`/Client`)**
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS (v4), Chakra UI, CSS Modules (Glassmorphism)
- **Animations:** GSAP, Framer Motion
- **State Management:** Zustand
- **Maps:** Leaflet, React-Leaflet, ArcGIS API
- **Real-time:** Socket.io-client

### **Backend (`/Server`)**
- **Runtime:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **Queues:** BullMQ + Redis
- **Auth:** JWT, Passport.js (Google OAuth)
- **Email:** Nodemailer
- **AI:** Google Generative AI (Gemini SDK)

---

## 🚀 Local Development

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Redis Server (Required for BullMQ queues)

### 2. Installation
Clone the repository and install dependencies concurrently:
\`\`\`bash
npm run install-all
\`\`\`

### 3. Environment Variables
You'll need to set up two `.env` files.

**Server (`/Server/.env`)**:
\`\`\`env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_uri
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173

# Email Config (Gmail App Passwords recommended)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI (Optional)
GEMINI_API_KEY=your_gemini_key
\`\`\`

**Client (`/Client/.env`)**:
\`\`\`env
VITE_API_URL=http://localhost:5000
VITE_GEMINI_API_KEY=your_gemini_key_here
\`\`\`

### 4. Running the App
Start both frontend and backend concurrently from the root directory:
\`\`\`bash
npm run dev
\`\`\`
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000](http://localhost:5000)
- BullMQ Dashboard: [http://localhost:5000/admin/queues](http://localhost:5000/admin/queues)

---

## 🌍 Deployment Guide

This project is configured as a decoupled monolith. The recommended deployment strategy is:
1. **Frontend (Client)** ➡️ **Vercel**
2. **Backend (Server)** ➡️ **Render**

Configuration files (`vercel.json` and `render.yaml`) are included in the root directory.

### Deploying the Backend to Render
1. Create an account on [Render](https://render.com).
2. You will need a managed **Redis** instance on Render (or an external Redis like Upstash) for the BullMQ queues.
3. You will need a **MongoDB Atlas** database.
4. Go to Render Dashboard -> **Blueprints** -> **New Blueprint Instance**.
5. Connect your repository. Render will detect the `render.yaml` file.
6. Fill in the required secret environment variables (MongoDB URI, Email Passwords, Redis URL, etc.) when prompted.
7. Click **Apply**. Render will automatically build and deploy the backend.
8. Copy the provided backend URL (e.g., `https://blood-donor-api.onrender.com`).

### Deploying the Frontend to Vercel
1. Create an account on [Vercel](https://vercel.com).
2. Go to your dashboard and click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. The root `vercel.json` will automatically configure Vercel to build the `Client/` directory.
5. In the **Environment Variables** section, add:
   - \`VITE_API_URL\` = Your Render Backend URL
   - \`VITE_GEMINI_API_KEY\` = Your Gemini Key (if using AI on the client)
6. Click **Deploy**.

*Don't forget to update the \`CLIENT_URL\` in your Render backend settings with your new Vercel frontend URL so CORS and Email links work properly!*
