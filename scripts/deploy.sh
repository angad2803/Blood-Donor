#!/bin/bash

# 🚀 Blood Donor App - Deployment Script
# This script prepares and deploys the application

set -e  # Exit on any error

echo "🩸 Blood Donor App - Deployment Script"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required tools
echo "🔍 Checking required tools..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Check environment files
echo "🔧 Checking environment configuration..."

if [ ! -f "Server/.env" ]; then
    echo "⚠️  Server/.env not found. Copying from example..."
    cp Server/.env.example Server/.env
    echo "📝 Please edit Server/.env with your actual configuration values"
fi

# Install dependencies
echo "📦 Installing dependencies..."

echo "🔄 Installing backend dependencies..."
cd Server
npm install --production

echo "🔄 Installing frontend dependencies..."
cd ../Client
npm install

cd ..

# Build frontend
echo "🏗️  Building frontend..."
cd Client
npm run build

cd ..

# Check if PM2 is installed for production
if command_exists pm2; then
    echo "✅ PM2 is available for process management"
    
    # Ask user if they want to start with PM2
    read -p "🚀 Do you want to start the application with PM2? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Starting application with PM2..."
        
        # Start backend
        cd Server
        pm2 start index.js --name "blooddonor-backend" --env production
        
        # Start frontend
        cd ../Client
        pm2 start npm --name "blooddonor-frontend" -- run dev
        
        # Save PM2 configuration
        pm2 save
        
        echo "✅ Application started with PM2!"
        echo "📊 Use 'pm2 status' to check application status"
        echo "📋 Use 'pm2 logs' to view logs"
        echo "🔄 Use 'pm2 restart all' to restart services"
    else
        echo "ℹ️  To start manually:"
        echo "   Backend: cd Server && npm start"
        echo "   Frontend: cd Client && npm run dev"
    fi
else
    echo "ℹ️  PM2 not installed. To install: npm install -g pm2"
    echo "🚀 Starting application manually..."
    
    # Start backend in background
    cd Server
    npm start &
    BACKEND_PID=$!
    
    # Start frontend in background
    cd ../Client
    npm run dev &
    FRONTEND_PID=$!
    
    echo "✅ Application started!"
    echo "🔗 Frontend: http://localhost:5173"
    echo "🔗 Backend: http://localhost:5000"
    echo "⚠️  Press Ctrl+C to stop both services"
    
    # Wait for user to stop
    trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
    wait
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "📱 Access your application:"
echo "   🌐 Frontend: http://localhost:5173"
echo "   🔧 Backend API: http://localhost:5000"
echo ""
echo "📚 Useful commands:"
echo "   📊 Check status: pm2 status"
echo "   📋 View logs: pm2 logs"
echo "   🔄 Restart: pm2 restart all"
echo "   🛑 Stop: pm2 stop all"
