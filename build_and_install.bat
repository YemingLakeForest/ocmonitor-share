@echo off
setlocal

echo ============================================
echo  OCMonitor - Build UI and Install
echo ============================================
echo.

:: Step 1: Build React frontend
echo [1/3] Building React frontend...
cd /d "%~dp0ocmonitor\web\frontend"
if not exist node_modules (
    echo      Installing npm dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed.
        exit /b 1
    )
)
call npm run build
if errorlevel 1 (
    echo ERROR: React build failed.
    exit /b 1
)
echo      Frontend build complete.
echo.

:: Step 2: Install package in editable mode
echo [2/3] Installing ocmonitor package...
cd /d "%~dp0"
pip install -e . >nul 2>&1
if errorlevel 1 (
    echo ERROR: pip install failed.
    exit /b 1
)
echo      Package installed.
echo.

:: Step 3: Copy ocmonitor.exe to target
echo [3/3] Installing ocmonitor.exe...
set "SRC="

:: Find the exe from pip's Scripts directory
for /f "delims=" %%i in ('python -c "import sysconfig; print(sysconfig.get_path('scripts', 'nt_user'))"') do set "SCRIPTS_DIR=%%i"

if exist "%SCRIPTS_DIR%\ocmonitor.exe" (
    set "SRC=%SCRIPTS_DIR%\ocmonitor.exe"
) else (
    :: Fallback: search common locations
    for /f "delims=" %%i in ('where ocmonitor.exe 2^>nul') do set "SRC=%%i"
)

set "DEST=C:\Users\Anson\.local\bin\ocmonitor.exe"

if not defined SRC (
    echo ERROR: Could not find ocmonitor.exe
    exit /b 1
)

:: Ensure target directory exists
if not exist "C:\Users\Anson\.local\bin" mkdir "C:\Users\Anson\.local\bin"

:: Kill any running ocmonitor process before copying
taskkill /f /im ocmonitor.exe >nul 2>&1

copy /Y "%SRC%" "%DEST%" >nul
if errorlevel 1 (
    echo ERROR: Failed to copy ocmonitor.exe
    echo      The file may be locked. Close any running ocmonitor and retry.
    exit /b 1
)
echo      Installed: %DEST%
echo.

echo ============================================
echo  Done! Run: ocmonitor web
echo ============================================
