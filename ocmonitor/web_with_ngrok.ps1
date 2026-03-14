Write-Host "Starting OpenCode Monitor Web UI with ngrok tunnel..." -ForegroundColor Green
Write-Host ""

# Start ocmonitor web in background
$webJob = Start-Job -ScriptBlock {
    ocmonitor web --port 9394 --no-browser
}

Write-Host "Waiting for web server to start..."
Start-Sleep -Seconds 3

# Start ngrok tunnel to port 9394
Write-Host "Starting ngrok tunnel to http://localhost:9394..." -ForegroundColor Cyan
$ngrokProcess = Start-Process -FilePath "ngrok" -ArgumentList "http 9394" -PassThru -NoNewWindow

Write-Host ""
Write-Host "Web UI is running at: http://localhost:9394" -ForegroundColor Yellow
Write-Host "Ngrok tunnel is active. Check ngrok console for public URL." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop both web server and ngrok..." -ForegroundColor Gray

try {
    # Wait for user to press Ctrl+C
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "`nStopping processes..." -ForegroundColor Red
    
    # Stop ngrok
    if ($ngrokProcess) {
        Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    # Stop web job
    if ($webJob) {
        Stop-Job $webJob -Force
        Remove-Job $webJob -Force
    }
    
    Write-Host "Stopped." -ForegroundColor Green
}