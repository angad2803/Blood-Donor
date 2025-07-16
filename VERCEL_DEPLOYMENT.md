# 🚀 Vercel Deployment Checklist

## ✅ Pre-Deployment

- [ ] MongoDB Atlas database set up and accessible
- [ ] `.env.local` file created in `nextjs-app/` with all required variables
- [ ] Tested the app locally with `npm run dev`
- [ ] Confirmed all API routes work (`/api/auth`, `/api/request`, etc.)

## 🌐 Vercel Deployment Steps

### 1. Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### 2. Navigate to the Next.js app

```bash
cd nextjs-app
```

### 3. Build the app locally (optional but recommended)

```bash
npm run build
```

### 4. Deploy to Vercel

```bash
vercel --prod
```

### 5. Configure Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

**Required Variables:**

- `MONGODB_URI` - Your MongoDB connection string
- `NEXTAUTH_SECRET` - Random secret for NextAuth (generate with: `openssl rand -base64 32`)
- `JWT_SECRET` - Secret for JWT tokens
- `NEXTAUTH_URL` - Your Vercel app URL (e.g., `https://yourapp.vercel.app`)

**Optional Variables:**

- `SENDGRID_API_KEY` - For email functionality
- `FROM_EMAIL` - Email sender address
- `GOOGLE_CLIENT_ID` - For Google OAuth
- `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `ARCGIS_API_KEY` - For map functionality

## ✅ Post-Deployment

- [ ] Test the live app at your Vercel URL
- [ ] Test user registration and login
- [ ] Test creating blood requests
- [ ] Test admin functionality
- [ ] Test all carousel components
- [ ] Test chat functionality
- [ ] Test mobile responsiveness

## 🎯 Key Benefits of This Deployment

- **Single deployment** - No separate backend needed
- **Serverless API routes** - Automatically scaled by Vercel
- **Optimized performance** - Built-in CDN and optimizations
- **Easy domain setup** - Custom domains in Vercel dashboard
- **Automatic HTTPS** - SSL certificates included
- **Zero downtime deploys** - Atomic deployments

## 🆘 Troubleshooting

### Build Errors

- Check for missing dependencies in `package.json`
- Ensure all imports are correct (case-sensitive)
- Verify environment variables are set

### API Route Issues

- Confirm all API routes are in `src/app/api/`
- Check database connection with correct MongoDB URI
- Verify NextAuth configuration

### Authentication Issues

- Ensure `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Verify JWT secrets are consistent

---

🎉 **Your blood donor app is now ready for production on Vercel!**
