#!/bin/bash

# Quick Deploy Script - Simplified
echo "🚀 Quick Deploy - Blood Donor App"
echo "=================================="

# Start backend
echo "🔄 Starting backend server..."
cd Server
npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

echo "✅ Backend started on http://localhost:5000"
echo "🆔 Backend PID: $BACKEND_PID"

# Start frontend in development mode (faster)
echo "🔄 Starting frontend in development mode..."
cd ../nextjs-app
npm run dev &
FRONTEND_PID=$!

sleep 3

echo "✅ Frontend started on http://localhost:3000"
echo "🆔 Frontend PID: $FRONTEND_PID"

echo ""
echo "🎉 Application is running!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Wait for user interrupt
wait
