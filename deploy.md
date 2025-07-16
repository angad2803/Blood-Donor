# 🚀 Blood Donor App - Deployment Guide

## 🎯 Deployment Strategy

**IMPORTANT:** This app uses a **Client-Server architecture** with separate frontend and backend:

- ✅ Frontend: React with Vite (`Client/` directory)
- ✅ Backend: Node.js with Express (`Server/` directory)
- ✅ Database: MongoDB + Redis
- ✅ Real-time: Socket.io
- ✅ AI: Gemini API integration

**Deploy both `Client/` and `Server/` directories separately**

## 📋 Pre-Deployment Checklist

### ✅ 1. Environment Setup

#### Backend Environment Variables

Create `Server/.env`:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GEMINI_API_KEY=your_gemini_api_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CLIENT_URL=https://your-frontend-url.vercel.app
```

#### Frontend Environment Variables

Create `Client/.env.production`:

```env
VITE_API_URL=https://your-backend-url.railway.app
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_SOCKET_URL=https://your-backend-url.railway.app
```

### ✅ 2. Production Build Setup

#### Update Vite Configuration

Update `Client/config/vite.config.js`:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          utils: ["axios", "socket.io-client"],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
```

#### Update Package.json Scripts

Add to `Client/package.json`:

```json
{
  "scripts": {
    "dev": "vite --config config/vite.config.js",
    "build": "vite build --config config/vite.config.js",
    "preview": "vite preview --config config/vite.config.js",
    "lint": "eslint . --config config/eslint.config.js"
  }
}
```

## 🚀 Vercel Deployment (Frontend Only)

### 🎯 React + Vite App Deployment

#### 1. Install Vercel CLI

```bash
npm i -g vercel
```

#### 2. Deploy the React App

```bash
cd Client
vercel --prod
```

#### 3. Configure Environment Variables in Vercel Dashboard

- Go to your Vercel project settings
- Add all environment variables from your `.env.production`
- **Critical variables:** `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`

#### 4. Build Settings for Vercel:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

## 🔧 Alternative Deployment Options

### Option 1: Railway Deployment (Recommended for Full-Stack)

#### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

#### 2. Login and Deploy

```bash
railway login
railway init
```

#### 3. Create `railway.toml`:

```toml
[build]
  builder = "NIXPACKS"

[deploy]
  startCommand = "npm start"

[[services]]
  name = "frontend"
  source = "Client"

[[services]]
  name = "backend"
  source = "Server"
```

### Option 2: Docker Deployment

#### 1. Create Dockerfile for Backend

Create `Server/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

#### 2. Create Dockerfile for Frontend

Create `Client/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Update Docker Compose

```yaml
version: "3.8"

services:
  redis:
    image: redis:7-alpine
    container_name: redis-blooddonor
    ports:
      - "6379:6379"
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  backend:
    build: ./Server
    container_name: blooddonor-backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  frontend:
    build: ./Client
    container_name: blooddonor-frontend
    ports:
      - "5173:80"
    environment:
      - VITE_API_URL=http://backend:5000
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  redis_data:
```

### Option 4: VPS/Cloud Server Deployment

#### 1. Server Setup (Ubuntu/Debian)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install Redis
sudo apt install redis-server
```

#### 2. Deploy Application

```bash
# Clone repository
git clone https://github.com/yourusername/blood-donor-app.git
cd blood-donor-app

# Setup backend
cd Server
npm install --production
pm2 start index.js --name "blooddonor-backend"

# Setup frontend
cd ../Client
npm install
npm run build
pm2 start "npm run preview" --name "blooddonor-frontend"

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 3. Nginx Configuration

Create `/etc/nginx/sites-available/blooddonor`:

```nginx
server {
    listen 80;
    server_name yourapp.com www.yourapp.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 4. SSL Setup with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourapp.com -d www.yourapp.com
```

## 📊 Production Optimizations

### 1. Database Setup

- Use MongoDB Atlas for managed database
- Set up proper indexes
- Configure backup strategies

### 2. Monitoring Setup

```bash
# Install monitoring tools
npm install -g @railway/cli
pm2 install pm2-server-monit
```

### 3. Security Headers

Add to Vite configuration or use middleware:

```javascript
// vite.config.js
export default defineConfig({
  // ... other config
  server: {
    headers: {
      "X-DNS-Prefetch-Control": "on",
      "X-XSS-Protection": "1; mode=block",
      "X-Frame-Options": "SAMEORIGIN",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "origin-when-cross-origin",
    },
  },
});
```

## 🚀 Quick Deploy Commands

### For Development Testing:

```bash
# Backend
cd Server && npm run dev

# Frontend
cd Client && npm run dev
```

### For Production:

```bash
# Build and start backend
cd Server && npm start

# Build and start frontend
cd Client && npm run build && npm run preview
```

## 📞 Support

If you need help with deployment:

1. Check logs: `pm2 logs` or `vercel logs`
2. Monitor performance: `pm2 monit`
3. Restart services: `pm2 restart all`

Choose the deployment option that best fits your needs:

- **Vercel**: Best for frontend-only or serverless
- **Railway**: Best for full-stack with managed services
- **Docker**: Best for containerized deployments
- **VPS**: Best for full control and custom setups
