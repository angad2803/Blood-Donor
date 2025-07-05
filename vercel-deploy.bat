@echo off
echo.
echo ================================================
echo   🚀 Blood Donor App - Vercel Deployment
echo ================================================
echo.

echo 📂 Navigating to Next.js app directory...
cd /d "d:\Blood_Donor\nextjs-app"

echo.
echo 🔍 Checking if Vercel CLI is installed...
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
) else (
    echo ✅ Vercel CLI found
)

echo.
echo 🛠️ Building the application...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed! Please check for errors.
    pause
    exit /b 1
)

echo.
echo 🚀 Deploying to Vercel...
echo.
echo 📝 Important: After deployment, remember to:
echo    1. Set environment variables in Vercel dashboard
echo    2. Configure your MongoDB URI
echo    3. Set up NextAuth secrets
echo.
echo Press any key to continue with deployment...
pause >nul

vercel --prod

echo.
echo ✅ Deployment complete!
echo 🌐 Your app should now be live at your Vercel URL
echo.
echo 📋 Next steps:
echo    1. Go to vercel.com/dashboard
echo    2. Open your project settings
echo    3. Add environment variables from .env.local
echo.
pause
