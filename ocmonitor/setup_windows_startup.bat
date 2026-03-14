@echo off
echo ==============================================
echo OpenCode Monitor Web UI - Windows Startup Setup
echo ==============================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Please run this script as Administrator!
    echo Right-click and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo This script will:
echo 1. Install NSSM (Non-Sucking Service Manager)
echo 2. Create Windows services for ocmonitor web and ngrok
echo 3. Configure services to auto-start on boot
echo 4. Create startup shortcut for easy management
echo.

set /p choice="Continue? (Y/N): "
if /i "%choice%" neq "Y" (
    echo Setup cancelled.
    pause
    exit /b 0
)

echo.
echo ==============================================
echo Step 1: Installing NSSM
echo ==============================================

if not exist "C:\Windows\nssm.exe" (
    echo Downloading NSSM 2.24...
    powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'nssm.zip' -UseBasicParsing"
    if errorlevel 1 (
        echo ERROR: Failed to download NSSM
        echo Please download manually from: https://nssm.cc/download
        pause
        exit /b 1
    )
    
    echo Extracting NSSM...
    powershell -Command "Expand-Archive -Path 'nssm.zip' -DestinationPath 'nssm_temp' -Force"
    if errorlevel 1 (
        echo ERROR: Failed to extract NSSM
        pause
        exit /b 1
    )
    
    echo Installing NSSM to C:\Windows\...
    copy "nssm_temp\nssm-2.24\win64\nssm.exe" "C:\Windows\" >nul
    if errorlevel 1 (
        echo ERROR: Failed to copy NSSM
        pause
        exit /b 1
    )
    
    rmdir /s /q nssm_temp >nul 2>&1
    del nssm.zip >nul 2>&1
    echo NSSM installed successfully.
) else (
    echo NSSM already installed.
)

echo.
echo ==============================================
echo Step 2: Creating Windows Services
echo ==============================================

set SCRIPT_DIR=%~dp0
set PYTHON_PATH=python.exe
set NGROK_PATH=ngrok

REM Check if ocmonitor is installed
where ocmonitor >nul 2>&1
if errorlevel 1 (
    echo WARNING: ocmonitor command not found in PATH
    echo Installing ocmonitor in development mode...
    cd /d "%SCRIPT_DIR%.."
    pip install -e .
    if errorlevel 1 (
        echo ERROR: Failed to install ocmonitor
        echo Please run manually: pip install -e .
        pause
        exit /b 1
    )
)

REM Check if ngrok is installed
where ngrok >nul 2>&1
if errorlevel 1 (
    echo WARNING: ngrok not found in PATH
    echo Please install ngrok from: https://ngrok.com/download
    echo And add it to your PATH or place in this directory.
    echo.
    set /p ngrok_continue="Continue without ngrok? (Y/N): "
    if /i "%ngrok_continue%" neq "Y" (
        echo Setup cancelled.
        pause
        exit /b 0
    )
    set NGROK_AVAILABLE=0
) else (
    set NGROK_AVAILABLE=1
)

echo.
echo Creating OCMonitorWeb service...
C:\Windows\nssm.exe install OCMonitorWeb "ocmonitor" "web --port 9394 --no-browser"
if errorlevel 1 (
    echo ERROR: Failed to create OCMonitorWeb service
    pause
    exit /b 1
)

C:\Windows\nssm.exe set OCMonitorWeb Description "OpenCode Monitor Web Dashboard - Port 9394"
C:\Windows\nssm.exe set OCMonitorWeb DisplayName "OpenCode Monitor Web"
C:\Windows\nssm.exe set OCMonitorWeb Start SERVICE_AUTO_START
C:\Windows\nssm.exe set OCMonitorWeb AppDirectory "%SCRIPT_DIR%"
C:\Windows\nssm.exe set OCMonitorWeb AppStdout "%SCRIPT_DIR%ocmonitor_web.log"
C:\Windows\nssm.exe set OCMonitorWeb AppStderr "%SCRIPT_DIR%ocmonitor_web_error.log"
C:\Windows\nssm.exe set OCMonitorWeb AppRotateFiles 1
C:\Windows\nssm.exe set OCMonitorWeb AppRotateOnline 1
C:\Windows\nssm.exe set OCMonitorWeb AppRotateSeconds 86400
C:\Windows\nssm.exe set OCMonitorWeb AppRotateBytes 1048576

echo OCMonitorWeb service created.

if "%NGROK_AVAILABLE%"=="1" (
    echo.
    echo Creating OCMonitorNgrok service...
    C:\Windows\nssm.exe install OCMonitorNgrok "ngrok" "http 9394"
    if errorlevel 1 (
        echo ERROR: Failed to create OCMonitorNgrok service
        echo Continuing without ngrok service...
    ) else (
        C:\Windows\nssm.exe set OCMonitorNgrok Description "Ngrok tunnel for OpenCode Monitor Web UI"
        C:\Windows\nssm.exe set OCMonitorNgrok DisplayName "OpenCode Monitor Ngrok"
        C:\Windows\nssm.exe set OCMonitorNgrok DependOnService OCMonitorWeb
        C:\Windows\nssm.exe set OCMonitorNgrok Start SERVICE_AUTO_START_DELAYED
        C:\Windows\nssm.exe set OCMonitorNgrok AppDirectory "%SCRIPT_DIR%"
        C:\Windows\nssm.exe set OCMonitorNgrok AppStdout "%SCRIPT_DIR%ngrok.log"
        C:\Windows\nssm.exe set OCMonitorNgrok AppStderr "%SCRIPT_DIR%ngrok_error.log"
        C:\Windows\nssm.exe set OCMonitorNgrok AppRotateFiles 1
        C:\Windows\nssm.exe set OCMonitorNgrok AppRotateOnline 1
        C:\Windows\nssm.exe set OCMonitorNgrok AppRotateSeconds 86400
        C:\Windows\nssm.exe set OCMonitorNgrok AppRotateBytes 1048576
        echo OCMonitorNgrok service created.
    )
)

echo.
echo ==============================================
echo Step 3: Creating Startup Shortcut
echo ==============================================

echo Creating desktop shortcut for service management...
set SHORTCUT_PATH="%USERPROFILE%\Desktop\OCMonitor Services.lnk"

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut(%SHORTCUT_PATH%); $s.TargetPath = 'cmd.exe'; $s.Arguments = '/k \"cd /d \"%SCRIPT_DIR%\" && manage_service.bat\"'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Description = 'OpenCode Monitor Service Manager'; $s.Save()"

if errorlevel 1 (
    echo WARNING: Failed to create desktop shortcut
) else (
    echo Desktop shortcut created: OCMonitor Services.lnk
)

echo.
echo ==============================================
echo Step 4: Creating Quick Start Script
echo ==============================================

echo Creating quick_start.bat for manual startup...
(
echo @echo off
echo echo Starting OpenCode Monitor Web UI...
echo echo.
echo start /B cmd /c "ocmonitor web --port 9394 --no-browser"
echo timeout /t 3 /nobreak ^>nul
echo.
echo if exist ngrok.exe (
echo     echo Starting ngrok tunnel...
echo     start /B cmd /c "ngrok http 9394"
echo ) else (
echo     echo Ngrok not found. Web UI running at: http://localhost:9394
echo )
echo.
echo echo Web UI: http://localhost:9394
echo echo Press any key to stop...
echo pause ^>nul
echo.
echo echo Stopping processes...
echo taskkill /F /IM python.exe ^>nul 2^>^&1
echo taskkill /F /IM ngrok.exe ^>nul 2^>^&1
echo echo Stopped.
) > "%SCRIPT_DIR%quick_start.bat"

echo quick_start.bat created.

echo.
echo ==============================================
echo Setup Complete!
echo ==============================================
echo.
echo Services created:
echo - OCMonitorWeb (Auto-start on boot)
if "%NGROK_AVAILABLE%"=="1" (
echo - OCMonitorNgrok (Auto-start after web service)
)
echo.
echo To start services now:
echo   net start OCMonitorWeb
if "%NGROK_AVAILABLE%"=="1" (
echo   net start OCMonitorNgrok
)
echo.
echo To stop services:
if "%NGROK_AVAILABLE%"=="1" (
echo   net stop OCMonitorNgrok
)
echo   net stop OCMonitorWeb
echo.
echo To check status:
echo   sc query OCMonitorWeb
if "%NGROK_AVAILABLE%"=="1" (
echo   sc query OCMonitorNgrok
)
echo.
echo Log files:
echo   %SCRIPT_DIR%ocmonitor_web.log
echo   %SCRIPT_DIR%ocmonitor_web_error.log
if "%NGROK_AVAILABLE%"=="1" (
echo   %SCRIPT_DIR%ngrok.log
echo   %SCRIPT_DIR%ngrok_error.log
)
echo.
echo Use the desktop shortcut "OCMonitor Services.lnk" for easy management.
echo Or run manage_service.bat from: %SCRIPT_DIR%
echo.
echo Web UI will be available at: http://localhost:9394
echo.
pause