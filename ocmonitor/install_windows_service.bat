@echo off
echo Installing OpenCode Monitor Web UI as Windows Service...
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Please run this script as Administrator!
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

REM Install NSSM (Non-Sucking Service Manager) if not present
if not exist "C:\Windows\nssm.exe" (
    echo Downloading NSSM...
    powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'nssm.zip'"
    powershell -Command "Expand-Archive -Path 'nssm.zip' -DestinationPath 'nssm_temp'"
    copy "nssm_temp\nssm-2.24\win64\nssm.exe" "C:\Windows\"
    rmdir /s /q nssm_temp
    del nssm.zip
    echo NSSM installed.
) else (
    echo NSSM already installed.
)

REM Create service for ocmonitor web
echo Creating 'OCMonitorWeb' service...
C:\Windows\nssm.exe install OCMonitorWeb "%CD%\..\python.exe" "-m ocmonitor.cli web --port 9394 --no-browser"
C:\Windows\nssm.exe set OCMonitorWeb Description "OpenCode Monitor Web Dashboard"
C:\Windows\nssm.exe set OCMonitorWeb AppDirectory "%CD%"
C:\Windows\nssm.exe set OCMonitorWeb Start SERVICE_AUTO_START
C:\Windows\nssm.exe set OCMonitorWeb AppStdout "%CD%\ocmonitor_web.log"
C:\Windows\nssm.exe set OCMonitorWeb AppStderr "%CD%\ocmonitor_web_error.log"

REM Create service for ngrok
echo Creating 'OCMonitorNgrok' service...
C:\Windows\nssm.exe install OCMonitorNgrok "ngrok" "http 9394"
C:\Windows\nssm.exe set OCMonitorNgrok Description "Ngrok tunnel for OpenCode Monitor Web UI"
C:\Windows\nssm.exe set OCMonitorNgrok DependOnService OCMonitorWeb
C:\Windows\nssm.exe set OCMonitorNgrok Start SERVICE_AUTO_START_DELAYED
C:\Windows\nssm.exe set OCMonitorNgrok AppStdout "%CD%\ngrok.log"
C:\Windows\nssm.exe set OCMonitorNgrok AppStderr "%CD%\ngrok_error.log"

echo.
echo Services created successfully!
echo.
echo To start services:
echo   net start OCMonitorWeb
echo   net start OCMonitorNgrok
echo.
echo To stop services:
echo   net stop OCMonitorNgrok
echo   net stop OCMonitorWeb
echo.
echo To remove services:
echo   sc delete OCMonitorNgrok
echo   sc delete OCMonitorWeb
echo.
pause