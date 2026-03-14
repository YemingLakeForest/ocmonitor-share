@echo off
echo OpenCode Monitor Web UI Service Management
echo ===========================================
echo.
echo 1. Start Web UI + Ngrok
echo 2. Stop Web UI + Ngrok
echo 3. Check status
echo 4. View logs
echo 5. Exit
echo.
set /p choice="Enter choice (1-5): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto status
if "%choice%"=="4" goto logs
if "%choice%"=="5" exit

:start
echo Starting services...
start /B cmd /c "cd /d %~dp0.. && python -m ocmonitor.cli web --port 9394 --no-browser"
timeout /t 3 /nobreak > nul
start /B cmd /c "ngrok http 9394"
echo Services started!
echo Web UI: http://localhost:9394
echo Check ngrok console for public URL
pause
exit

:stop
echo Stopping services...
taskkill /F /IM python.exe > nul 2>&1
taskkill /F /IM ngrok.exe > nul 2>&1
echo Services stopped.
pause
exit

:status
echo Checking service status...
tasklist | findstr python.exe > nul && echo Web UI: RUNNING || echo Web UI: STOPPED
tasklist | findstr ngrok.exe > nul && echo Ngrok: RUNNING || echo Ngrok: STOPPED
netstat -an | findstr :9394 > nul && echo Port 9394: LISTENING || echo Port 9394: NOT LISTENING
pause
exit

:logs
echo Recent log output:
echo.
if exist ocmonitor_web.log (
    echo === Web UI Log (last 10 lines) ===
    tail -10 ocmonitor_web.log
) else (
    echo No web UI log found.
)
echo.
if exist ngrok.log (
    echo === Ngrok Log (last 10 lines) ===
    tail -10 ngrok.log
) else (
    echo No ngrok log found.
)
pause
exit