@echo off
REM 🚀 Blood Donor App - Windows Deployment Script

echo 🩸 Blood Donor App - Windows Deployment Script
echo ==========================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Run this script from the project root directory
    exit /b 1
)

REM Check required tools
echo 🔍 Checking required tools...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Check environment files
echo 🔧 Checking environment configuration...

if not exist "Server\.env" (
    echo ⚠️  Server\.env not found. Copying from example...
    copy "Server\.env.example" "Server\.env"
    echo 📝 Please edit Server\.env with your actual configuration values
)

if not exist "nextjs-app\.env.local" (
    echo ⚠️  nextjs-app\.env.local not found. Copying from example...
    copy "nextjs-app\.env.example" "nextjs-app\.env.local"
    echo 📝 Please edit nextjs-app\.env.local with your actual configuration values
)

REM Install dependencies
echo 📦 Installing dependencies...

echo 🔄 Installing backend dependencies...
cd Server
npm install --production
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    exit /b 1
)

echo 🔄 Installing frontend dependencies...
cd ..\nextjs-app
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    exit /b 1
)

cd ..

REM Build frontend
echo 🏗️  Building frontend...
cd nextjs-app
npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build frontend
    exit /b 1
)

cd ..

REM Check if PM2 is installed
where pm2 >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ PM2 is available for process management
    
    set /p choice="🚀 Do you want to start the application with PM2? (y/n): "
    if /i "%choice%"=="y" (
        echo 🔄 Starting application with PM2...
        
        REM Start backend
        cd Server
        pm2 start index.js --name "blooddonor-backend" --env production
        
        REM Start frontend
        cd ..\nextjs-app
        pm2 start npm --name "blooddonor-frontend" -- start
        
        REM Save PM2 configuration
        pm2 save
        
        echo ✅ Application started with PM2!
        echo 📊 Use 'pm2 status' to check application status
        echo 📋 Use 'pm2 logs' to view logs
        echo 🔄 Use 'pm2 restart all' to restart services
    ) else (
        echo ℹ️  To start manually:
        echo    Backend: cd Server ^&^& npm start
        echo    Frontend: cd nextjs-app ^&^& npm start
    )
) else (
    echo ℹ️  PM2 not installed. To install: npm install -g pm2
    echo 🚀 You can now start the application manually:
    echo    1. Open terminal 1: cd Server ^&^& npm start
    echo    2. Open terminal 2: cd nextjs-app ^&^& npm start
)

echo 🎉 Deployment completed successfully!
echo.
echo 📱 Access your application:
echo    🌐 Frontend: http://localhost:3000
echo    🔧 Backend API: http://localhost:5000
echo.
echo 📚 Useful commands:
echo    📊 Check status: pm2 status
echo    📋 View logs: pm2 logs
echo    🔄 Restart: pm2 restart all
echo    🛑 Stop: pm2 stop all

pause
