@echo off
echo Starting OpenCode Monitor Web UI with ngrok tunnel...
echo.

REM Start ocmonitor web in background
start /B cmd /c "ocmonitor web --port 9394 --no-browser"
echo Waiting for web server to start...
timeout /t 3 /nobreak > nul

REM Start ngrok tunnel to port 9394
echo Starting ngrok tunnel to http://localhost:9394...
ngrok http 9394

echo.
echo Press any key to stop both web server and ngrok...
pause > nul

REM Kill background processes
taskkill /F /IM python.exe > nul 2>&1
taskkill /F /IM ngrok.exe > nul 2>&1
echo Stopped.