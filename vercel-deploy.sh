#!/bin/bash

echo ""
echo "================================================"
echo "  🚀 Blood Donor App - Vercel Deployment"
echo "================================================"
echo ""

echo "📂 Navigating to Next.js app directory..."
cd "$(dirname "$0")/nextjs-app"

echo ""
echo "🔍 Checking if Vercel CLI is installed..."
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
else
    echo "✅ Vercel CLI found"
fi

echo ""
echo "🛠️ Building the application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please check for errors."
    exit 1
fi

echo ""
echo "🚀 Deploying to Vercel..."
echo ""
echo "📝 Important: After deployment, remember to:"
echo "   1. Set environment variables in Vercel dashboard"
echo "   2. Configure your MongoDB URI"
echo "   3. Set up NextAuth secrets"
echo ""
echo "Press any key to continue with deployment..."
read -n 1 -s

vercel --prod

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app should now be live at your Vercel URL"
echo ""
echo "📋 Next steps:"
echo "   1. Go to vercel.com/dashboard"
echo "   2. Open your project settings"
echo "   3. Add environment variables from .env.local"
echo ""
