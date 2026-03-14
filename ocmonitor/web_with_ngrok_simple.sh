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

echo "Waiting for web server to start (3 seconds)..."
sleep 3

# Check if web server process is still running
if ! kill -0 $WEB_PID 2>/dev/null; then
    echo "Error: Web server failed to start"
    exit 1
fi

echo "Web server started successfully (PID: $WEB_PID)"

# Start ngrok tunnel to port 9394 in a new terminal window if possible
echo "Starting ngrok tunnel to http://localhost:9394..."
echo "Note: Ngrok will run in current terminal. Open a new terminal for other commands."
echo ""

# Run ngrok in foreground
ngrok http 9394

# If we get here, ngrok exited
cleanup