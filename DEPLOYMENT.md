# Deployment Plan

This deployment guide has been meticulously generated based on the _actual_ codebase implementation. Read the "Deployment Risks & Fixes" section carefully, as there are a few hardcoded changes required before going to production.

## 1. Project Architecture Overview

The Blood Donor application is a comprehensive full-stack JavaScript project.

- **Frontend (Client)**: A React SPA bundled with Vite. State is managed with Zustand, UI with TailwindCSS & Chakra, animations with GSAP.
- **Backend (Server)**: Node.js/Express app. Handles RESTful routing and real-time WebSockets via `socket.io`.
- **Background Processing**: Redis-backed BullMQ is used for queues. **Note:** The queue workers run _inside_ the same process as the web server (`index.js`). No separate worker dyno/process is necessary unless you refactor the initialization.
- **Database**: MongoDB handles standard data structures.
- **External Services**: Uses Nodemailer (SMTP, not Resend) for emails, Google OAuth for authentication, ArcGIS for backend geolocation processing, and Gemini/OpenAI for chatbot and matching features.

## 2. Frontend Deployment Strategy

- **Recommended Platform**: Vercel, Netlify, or Cloudflare Pages.
- **Build Command**: `npm run build` (or `vite build --config config/vite.config.js` typically abstracted by Vite defaults).
- **Output Directory**: `dist`
- **Routing Note**: Must be configured to rewrite all traffic to `index.html` (SPAs require this).
- **Required Environment Variables**:
  - `VITE_API_URL`: The production URL of the deployed backend API (e.g., `https://api.yourdomain.com/api`).
  - `VITE_OPENAI_API_KEY` (Optional)
  - `VITE_GEMINI_API_KEY` (Optional)

## 3. Backend Deployment Strategy

- **Recommended Platform**: Render, Railway, or standard VPS (AWS EC2/DigitalOcean). Due to WebSockets and long-running bullmq queues, serverless platforms like Vercel Functions are **not** supported for the backend.
- **Start Command**: `npm start` (Runs `node index.js`, spinning up both the API and Queue Workers).
- **Port Configuration**: Determined by `PORT` env var (host platforms pass this in automatically).

## 4. Database & Queue Setup

- **MongoDB (Database)**: Use MongoDB Atlas. Add connection string to `MONGO_URI`.
- **Redis (Queues)**: Use Upstash or AWS ElastiCache. Redis is strictly required since BullMQ handles matching routines, emails, and SMS. Provide `REDIS_URL`.

## 5. Third-Party Services Integration

- **Email**: Nodemailer is used for emails. Despite `.env.example` referencing "Resend", the code uses SMTP directly (`emailService.js`).
- **Google OAuth**: Handled by `passport-google-oauth20`. `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are needed.
- **ArcGIS**: Handled on the server `geolocationService.js` using `ARCGIS_API_KEY`.
- **AI**: Handled via `Server/routes/ai.js`. Accepts `AI_PROVIDER` (gemini or openai), and their respective keys (`GEMINI_API_KEY` or `OPENAI_API_KEY`).

## 6. Exact Environment Variable Checklist

**Frontend (`Client/.env`)**:

- [ ] `VITE_API_URL`
- [ ] `VITE_OPENAI_API_KEY` (Optional)
- [ ] `VITE_GEMINI_API_KEY` (Optional)

**Backend (`Server/.env`)**:

- [ ] `NODE_ENV=production`
- [ ] `PORT` (usually auto-configured)
- [ ] `MONGO_URI`
- [ ] `REDIS_URL`
- [ ] `JWT_SECRET`
- [ ] `CLIENT_URL` (Domain of your deployed frontend, e.g., `https://myfrontend.vercel.app`. Crucial for Email links and Auth redirection fallback)
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `ENABLE_WELCOME_EMAILS=true`
- [ ] `EMAIL_HOST` (e.g., smtp.gmail.com)
- [ ] `EMAIL_PORT` (e.g., 587)
- [ ] `EMAIL_USER`
- [ ] `EMAIL_PASS` (e.g., Google App Password)
- [ ] `SUPPORT_EMAIL`
- [ ] `ARCGIS_API_KEY`
- [ ] `AI_PROVIDER` (openai or gemini)
- [ ] `GEMINI_API_KEY` (Optional if using openai)
- [ ] `OPENAI_API_KEY` (Optional if using gemini)

## 7. Required Pre-Deployment Fixes

🚨 **DO NOT DEPLOY WITHOUT FIXING THESE FIRST. THEY WILL BREAK PRODUCTION.**

1. **Hardcoded CORS Allowlist (`Server/index.js`)**
   - Express CORS (Around Line 111) and Socket.io CORS (Around Line 48) are hardcoded to `["http://localhost:5173", "http://localhost:3000"]`. You **MUST** change this read `process.env.CLIENT_URL` or requests from your production frontend will be blocked.
2. **Hardcoded OAuth Login URL (`Client/components/auth/Login.jsx`)**
   - The "Sign in with Google" button is hardcoded to `<a href="http://localhost:5000/api/auth/google">`. Update this to point to `VITE_API_URL + "/auth/google"`.
3. **Unprotected BullMQ Dashboard (`Server/index.js`)**
   - You mounted the Bull-Board dashboard using `app.use("/admin/queues", bullBoardRouter);` without any authentication. This leaves your Redis queues open to the public web. You MUST wrap this route in the `adminAuth` middleware.

## 8. Deployment Sequence

1. **Gather Credentials**: Create a MongoDB Atlas cluster, a Redis instance, a Google Cloud project (for OAuth Credentials), and ArcGIS/AI keys.
2. **Apply Pre-Deployment Fixes**: Make the code changes mentioned in step 7.
3. **Deploy Backend**:
   - Push to Railway or Render.
   - Inject the Backend Environment Variables.
   - Obtain the backend production URL (e.g., `https://server.render.com`).
4. **Deploy Frontend**:
   - Push to Vercel/Netlify.
   - Supply `VITE_API_URL` pointing to your backend production URL.
   - Obtain the frontend production URL (e.g., `https://frontend.vercel.app`).
5. **Final Linkage**:
   - Add the frontend production URL to the backend's `CLIENT_URL` variable.
   - Update your backend's Google OAuth settings in the Google Cloud Console to include your production callback URL (`https://server.render.com/api/auth/google/callback`).

## 9. Cost Estimates (Using Free Tiers)

To start with minimal costs:

1. **Frontend (Vercel/Netlify)**: Free tier (Hobby plan). Cost: $0.
2. **Backend (Render/Railway)**: Requires long-running server for WebSockets/Workers. Render free tier exists but sleeps; Railway starts at ~$5/mo. Estimated Cost: $5/mo.
3. **Database (MongoDB Atlas)**: Free M0 Sandbox tier (512MB storage). Cost: $0.
4. **Redis (Upstash)**: Free tier (10k commands/day). Cost: $0.
5. **APIs**: Gemini/ArcGIS have highly generous developer tiers. Cost: $0.
6. **Email (Nodemailer via Gmail)**: Free. Cost: $0.

**Estimated Initial Total Cost**: ~$5 / month.
