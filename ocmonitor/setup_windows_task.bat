@echo off
echo ==============================================
echo OpenCode Monitor Web UI - Windows Task Scheduler Setup
echo ==============================================
echo.
echo This script creates scheduled tasks that run on:
echo 1. System startup (auto-start web UI)
echo 2. User login (optional ngrok tunnel)
echo.
echo No NSSM required - uses built-in Windows Task Scheduler.
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

set SCRIPT_DIR=%~dp0

echo Checking prerequisites...
echo.

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
    echo ocmonitor installed successfully.
) else (
    echo ✓ ocmonitor found in PATH
)

REM Check if ngrok is installed
where ngrok >nul 2>&1
if errorlevel 1 (
    echo WARNING: ngrok not found in PATH
    echo Please install ngrok from: https://ngrok.com/download
    echo And add it to your PATH or place ngrok.exe in: %SCRIPT_DIR%
    echo.
    set /p ngrok_continue="Continue without ngrok? (Y/N): "
    if /i "%ngrok_continue%" neq "Y" (
        echo Setup cancelled.
        pause
        exit /b 0
    )
    set NGROK_AVAILABLE=0
) else (
    echo ✓ ngrok found in PATH
    set NGROK_AVAILABLE=1
)

echo.
echo ==============================================
echo Creating Wrapper Scripts
echo ==============================================

echo Creating web_ui_wrapper.bat...
(
echo @echo off
echo cd /d "%~dp0"
echo ocmonitor web --port 9394 --no-browser
) > "%SCRIPT_DIR%web_ui_wrapper.bat"

if "%NGROK_AVAILABLE%"=="1" (
    echo Creating ngrok_wrapper.bat...
    (
    echo @echo off
    echo cd /d "%~dp0"
    echo ngrok http 9394
    ) > "%SCRIPT_DIR%ngrok_wrapper.bat"
)

echo.
echo ==============================================
echo Creating Scheduled Tasks
echo ==============================================

REM Delete existing tasks if they exist
echo Removing existing tasks if any...
schtasks /delete /tn "OCMonitorWeb" /f >nul 2>&1
schtasks /delete /tn "OCMonitorNgrok" /f >nul 2>&1

REM Create task for web UI (runs at system startup)
echo Creating task: OCMonitorWeb (starts at system boot)...
schtasks /create /tn "OCMonitorWeb" /tr "\"%SCRIPT_DIR%web_ui_wrapper.bat\"" /sc onstart /ru SYSTEM /rl HIGHEST /f
if errorlevel 1 (
    echo ERROR: Failed to create OCMonitorWeb task
    pause
    exit /b 1
)
echo ✓ OCMonitorWeb task created (runs at system startup)

if "%NGROK_AVAILABLE%"=="1" (
    echo.
    echo Creating task: OCMonitorNgrok (starts at user login)...
    schtasks /create /tn "OCMonitorNgrok" /tr "\"%SCRIPT_DIR%ngrok_wrapper.bat\"" /sc onlogon /ru "%USERNAME%" /rl HIGHEST /f
    if errorlevel 1 (
        echo WARNING: Failed to create OCMonitorNgrok task
        echo Continuing without ngrok task...
        set NGROK_AVAILABLE=0
    ) else (
        echo ✓ OCMonitorNgrok task created (runs at user login)
    )
)

echo.
echo ==============================================
echo Creating Management Scripts
echo ==============================================

echo Creating start_ocmonitor.bat...
(
echo @echo off
echo echo Starting OpenCode Monitor Web UI...
echo echo.
echo start /B cmd /c "ocmonitor web --port 9394 --no-browser"
echo timeout /t 3 /nobreak ^>nul
echo.
echo if exist "%%~dp0ngrok.exe" (
echo     echo Starting ngrok tunnel...
echo     start /B cmd /c "ngrok http 9394"
echo ) else if exist "%%~dp0..\ngrok.exe" (
echo     echo Starting ngrok tunnel...
echo     start /B cmd /c "%%~dp0..\ngrok.exe http 9394"
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
) > "%SCRIPT_DIR%start_ocmonitor.bat"

echo Creating stop_ocmonitor.bat...
(
echo @echo off
echo echo Stopping OpenCode Monitor services...
echo echo.
echo schtasks /end /tn "OCMonitorWeb" /f ^>nul 2^>^&1
echo schtasks /end /tn "OCMonitorNgrok" /f ^>nul 2^>^&1
echo.
echo echo Killing any remaining processes...
echo taskkill /F /IM python.exe ^>nul 2^>^&1
echo taskkill /F /IM ngrok.exe ^>nul 2^>^&1
echo.
echo echo Services stopped.
echo echo Note: Tasks will auto-start again on next boot/login.
) > "%SCRIPT_DIR%stop_ocmonitor.bat"

echo Creating status_ocmonitor.bat...
(
echo @echo off
echo echo OpenCode Monitor Status
echo echo ========================
echo echo.
echo echo Scheduled Tasks:
echo schtasks /query /tn "OCMonitorWeb" /fo list | findstr "Status"
echo schtasks /query /tn "OCMonitorNgrok" /fo list | findstr "Status"
echo.
echo echo Running Processes:
echo tasklist | findstr /i "python.exe"
echo tasklist | findstr /i "ngrok.exe"
echo.
echo echo Port Check:
echo netstat -an | findstr ":9394"
echo.
echo echo Web UI: http://localhost:9394
) > "%SCRIPT_DIR%status_ocmonitor.bat"

echo Creating desktop shortcut...
set SHORTCUT_PATH="%USERPROFILE%\Desktop\OCMonitor Control.lnk"
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut(%SHORTCUT_PATH%); $s.TargetPath = 'cmd.exe'; $s.Arguments = '/k \"cd /d \"%SCRIPT_DIR%\" && echo OpenCode Monitor Control Panel && echo. && echo 1. start_ocmonitor.bat - Start manually && echo 2. stop_ocmonitor.bat - Stop services && echo 3. status_ocmonitor.bat - Check status && echo. && echo Tasks auto-start on boot/login.\"'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Description = 'OpenCode Monitor Control Panel'; $s.Save()"

echo.
echo ==============================================
echo Setup Complete!
echo ==============================================
echo.
echo Tasks created:
echo - OCMonitorWeb: Runs at system startup (as SYSTEM)
echo   ^> Starts web UI on port 9394
if "%NGROK_AVAILABLE%"=="1" (
echo - OCMonitorNgrok: Runs at user login (as %USERNAME%)
echo   ^> Starts ngrok tunnel to port 9394
)
echo.
echo Wrapper scripts created:
echo - web_ui_wrapper.bat : Web UI launcher
if "%NGROK_AVAILABLE%"=="1" (
echo - ngrok_wrapper.bat  : Ngrok launcher
)
echo.
echo Management scripts created:
echo - start_ocmonitor.bat : Start manually
echo - stop_ocmonitor.bat  : Stop services
echo - status_ocmonitor.bat: Check status
echo.
echo Desktop shortcut: OCMonitor Control.lnk
echo.
echo To manage tasks manually:
echo   taskschd.msc
echo.
echo Or use command line:
echo   schtasks /query /tn OCMonitorWeb
echo   schtasks /run /tn OCMonitorWeb
echo   schtasks /end /tn OCMonitorWeb
echo.
echo Web UI will auto-start on boot at: http://localhost:9394
echo.
echo Note: Ngrok may need authentication. Run once:
echo   ngrok config add-authtoken YOUR_TOKEN
echo.
pause