#!/bin/bash

echo "Starting OpenCode Monitor Web UI with ngrok tunnel..."
echo ""

# Create a temporary file for web server output
WEB_OUTPUT=$(mktemp)

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping processes..."
    kill $WEB_PID 2>/dev/null
    kill $NGROK_PID 2>/dev/null
    rm -f "$WEB_OUTPUT"
    echo "Stopped."
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Start ocmonitor web in background, redirect output to file
echo "Starting web dashboard on port 9394..."
ocmonitor web --port 9394 --no-browser > "$WEB_OUTPUT" 2>&1 &
WEB_PID=$!

echo "Waiting for web server to start (5 seconds)..."
sleep 5

# Check if web server process is still running
if ! kill -0 $WEB_PID 2>/dev/null; then
    echo "Error: Web server failed to start"
    echo "Web server output:"
    cat "$WEB_OUTPUT"
    rm -f "$WEB_OUTPUT"
    exit 1
fi

echo "Web server started successfully (PID: $WEB_PID)"

# Start ngrok tunnel to port 9394
echo "Starting ngrok tunnel to http://localhost:9394..."
ngrok http 9394 &
NGROK_PID=$!

echo ""
echo "=============================================="
echo "Web UI is running at: http://localhost:9394"
echo "Web UI is running at: http://127.0.0.1:9394"
echo "Ngrok tunnel is active. Check ngrok console for public URL."
echo "=============================================="
echo ""
echo "Press Ctrl+C to stop both web server and ngrok..."
echo ""

# Show web server output in background
tail -f "$WEB_OUTPUT" &
TAIL_PID=$!

# Wait for ngrok process
wait $NGROK_PID

# Cleanup
kill $TAIL_PID 2>/dev/null
cleanup