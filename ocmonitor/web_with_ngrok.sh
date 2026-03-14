#!/bin/bash

echo "Starting OpenCode Monitor Web UI with ngrok tunnel..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping processes..."
    kill $WEB_PID 2>/dev/null
    kill $NGROK_PID 2>/dev/null
    echo "Stopped."
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Start ocmonitor web in background
echo "Starting web dashboard on port 9394..."
ocmonitor web --port 9394 --no-browser &
WEB_PID=$!

echo "Waiting for web server to start..."
sleep 3

# Check if web server is running
if ! kill -0 $WEB_PID 2>/dev/null; then
    echo "Error: Web server failed to start"
    exit 1
fi

# Check if port 9394 is listening
if ! nc -z localhost 9394 2>/dev/null; then
    echo "Error: Web server not listening on port 9394"
    kill $WEB_PID 2>/dev/null
    exit 1
fi

# Start ngrok tunnel to port 9394
echo "Starting ngrok tunnel to http://localhost:9394..."
ngrok http 9394 &
NGROK_PID=$!

echo ""
echo "Web UI is running at: http://localhost:9394"
echo "Ngrok tunnel is active. Check ngrok console for public URL."
echo ""
echo "Press Ctrl+C to stop both web server and ngrok..."

# Wait for user to press Ctrl+C
wait $NGROK_PID