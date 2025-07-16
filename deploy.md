# 🚀 Blood Donor App - Deployment Guide

## 🎯 Deployment Strategy

**IMPORTANT:** This app deploys as a **SINGLE Next.js project** on Vercel. The Next.js app contains:

- ✅ Frontend pages and components (`src/app/`, `src/components/`)
- ✅ API routes (`src/app/api/`) that replace the separate Express server
- ✅ Authentication, database, and all backend logic via Next.js API routes

**Deploy ONLY the `nextjs-app/` directory** - no separate backend needed!

## 📋 Pre-Deployment Checklist

### ✅ 1. Environment Setup

#### Next.js App Environment Variables

Create `nextjs-app/.env.local` (the ONLY .env file needed):

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blooddonor?retryWrites=true&w=majority
# Local MongoDB: mongodb://localhost:27017/blooddonor

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_EXPIRES_IN=7d

# Email Configuration (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourapp.com

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Redis Configuration
REDIS_URL=redis://localhost:6379
# Production Redis: redis://username:password@host:port

# Server Configuration
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://yourapp.com

# ArcGIS Configuration (Optional)
ARCGIS_API_KEY=your-arcgis-api-key
```

#### Frontend Environment Variables

Create `nextjs-app/.env.local`:

```env
# NextAuth Configuration
NEXTAUTH_URL=https://yourapp.com
NEXTAUTH_SECRET=your-nextauth-secret-here

# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourapp.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourapp.com

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ArcGIS Configuration
NEXT_PUBLIC_ARCGIS_API_KEY=your-arcgis-api-key
```

### ✅ 2. Production Build Setup

#### Update Next.js Configuration

Update `nextjs-app/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost", "yourapp.com"],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Static export if needed
  // output: 'export',
  // trailingSlash: true,
  // images: { unoptimized: true }
};

module.exports = nextConfig;
```

#### Update Package.json Scripts

Add to `nextjs-app/package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "export": "next build && next export"
  }
}
```

## 🚀 Vercel Deployment (Recommended)

### 🎯 Single Next.js App Deployment

#### 1. Install Vercel CLI

```bash
npm i -g vercel
```

#### 2. Deploy the Next.js App

```bash
cd nextjs-app
vercel --prod
```

#### 3. Configure Environment Variables in Vercel Dashboard

- Go to your Vercel project settings
- Add all environment variables from your `.env.local`
- **Critical variables:** `MONGODB_URI`, `NEXTAUTH_SECRET`, `JWT_SECRET`

#### 4. Vercel Automatically Handles:

- ✅ Frontend pages and components
- ✅ API routes (`/api/*`) as serverless functions
- ✅ Authentication, database, email, all backend logic
- ✅ Optimized builds and CDN distribution

## 🔧 Alternative Deployment Options

#### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

#### 2. Login and Deploy

```bash
railway login
railway init
railway up
```

#### 3. Create `railway.toml`:

```toml
[build]
  builder = "NIXPACKS"

[deploy]
  startCommand = "npm start"

[[services]]
  name = "frontend"
  source = "nextjs-app"

[[services]]
  name = "backend"
  source = "Server"
```

### Option 3: Docker Deployment

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

Create `nextjs-app/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
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
    build: ./nextjs-app
    container_name: blooddonor-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:5000
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
cd ../nextjs-app
npm install
npm run build
pm2 start npm --name "blooddonor-frontend" -- start

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
        proxy_pass http://localhost:3000;
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

Add to Next.js configuration:

```javascript
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};
```

## 🚀 Quick Deploy Commands

### For Development Testing:

```bash
# Backend
cd Server && npm run dev

# Frontend
cd nextjs-app && npm run dev
```

### For Production:

```bash
# Build and start backend
cd Server && npm start

# Build and start frontend
cd nextjs-app && npm run build && npm start
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
