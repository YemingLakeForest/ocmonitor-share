# OpenCode Monitor Web Dashboard

A React Material UI web dashboard for visualizing OpenCode session analytics, costs, and usage metrics.

## Features

- **Real-time Dashboard**: Live monitoring of current OpenCode sessions
- **Session Analytics**: Detailed breakdown of token usage and costs
- **Model Statistics**: Usage statistics across different AI models
- **Project Insights**: Cost analysis by project
- **Time-based Reports**: Daily, weekly, and monthly usage breakdowns
- **Public Access**: Expose via ngrok for remote access

## Installation

### 1. Install Dependencies

```bash
# From project root
pip install -e .
```

This installs the `ocmonitor` CLI command globally.

### 2. Install Web UI Dependencies

```bash
# Install Flask (required for web server)
pip install flask>=3.0.0
```

## Usage

### Start Web Dashboard

```bash
# Default port (9394)
ocmonitor web

# Custom port
ocmonitor web --port 3000

# Don't auto-open browser
ocmonitor web --no-browser

# Custom host (bind to all interfaces)
ocmonitor web --host 0.0.0.0
```

### Access the Dashboard

Once started, access the dashboard at:
- **Local**: http://localhost:9394
- **Network**: http://[your-ip]:9394

## Ngrok Integration

Expose your local web dashboard to the internet using ngrok:

### Using Batch Script (Windows)

```bash
# Run from ocmonitor/ directory
web_with_ngrok.bat
```

### Using PowerShell

```powershell
# Run from ocmonitor/ directory
.\web_with_ngrok.ps1
```

### Manual Ngrok Setup

1. Install ngrok: https://ngrok.com/download
2. Start web dashboard:
   ```bash
   ocmonitor web --port 9394 --no-browser
   ```
3. In another terminal:
   ```bash
   ngrok http 9394
   ```
4. Use the public URL provided by ngrok

## Windows Service (Auto-start)

For automatic startup on Windows:

### 1. Install as Service

Run as Administrator:
```bash
install_windows_service.bat
```

This creates two services:
- **OCMonitorWeb**: Web dashboard on port 9394
- **OCMonitorNgrok**: Ngrok tunnel (depends on OCMonitorWeb)

### 2. Service Management

```bash
# Start services
net start OCMonitorWeb
net start OCMonitorNgrok

# Stop services
net stop OCMonitorNgrok
net stop OCMonitorWeb

# Check status
sc query OCMonitorWeb
sc query OCMonitorNgrok
```

### 3. Using Service Manager

For easy management, use:
```bash
manage_service.bat
```

Options:
- Start Web UI + Ngrok
- Stop Web UI + Ngrok  
- Check status
- View logs

## API Endpoints

The web server provides REST API endpoints:

- `GET /api/summary` - Overall usage summary
- `GET /api/sessions` - List all sessions
- `GET /api/sessions/{session_id}` - Detailed session info
- `GET /api/models` - Model usage statistics
- `GET /api/projects` - Project usage statistics
- `GET /api/daily` - Daily breakdown
- `GET /api/weekly` - Weekly breakdown
- `GET /api/monthly` - Monthly breakdown
- `GET /api/live` - Live session data
- `GET /api/metrics` - Prometheus metrics

## Configuration

### Web Server Settings

Default configuration:
- **Port**: 9394
- **Host**: 127.0.0.1 (localhost)
- **Auto-browser**: Enabled
- **Debug mode**: Disabled

Override via CLI options:
```bash
ocmonitor web --port 8080 --host 0.0.0.0 --debug --no-browser
```

### Ngrok Configuration

Ngrok uses default configuration. For advanced settings:
1. Create `ngrok.yml` in your home directory
2. Configure authentication, domains, etc.
3. Reference: https://ngrok.com/docs/agent/config

## Troubleshooting

### Web Server Won't Start

1. **Check port availability**:
   ```bash
   netstat -an | findstr :9394
   ```
2. **Verify installation**:
   ```bash
   ocmonitor --version
   ```
3. **Check Flask installation**:
   ```bash
   python -c "import flask; print(flask.__version__)"
   ```

### Ngrok Issues

1. **Ngrok not found**:
   - Install ngrok from https://ngrok.com/download
   - Add to PATH or place in project directory

2. **Authentication required**:
   - Sign up for ngrok account
   - Add authtoken: `ngrok config add-authtoken YOUR_TOKEN`

3. **Connection refused**:
   - Ensure web server is running first
   - Verify port matches: `ngrok http 9394`

### Service Installation Fails

1. **Run as Administrator**:
   - Right-click → "Run as administrator"

2. **NSSM download fails**:
   - Manual download: https://nssm.cc/download
   - Extract `nssm.exe` to `C:\Windows\`

3. **Path issues**:
   - Ensure `ocmonitor` command is in PATH
   - Run `pip install -e .` from project root

## Development

### Frontend (React)

The frontend is built with React and Material UI. Source files are in `frontend/` directory.

### Backend (Flask)

The backend is a Flask application serving both API endpoints and static React files.

### Building Frontend

```bash
cd frontend
npm install
npm run build
```

The build output is served from `frontend/build/`.

## Security Notes

1. **Localhost by default**: Web server binds to 127.0.0.1 for security
2. **Use ngrok for public access**: Provides HTTPS and authentication
3. **Consider firewall**: Expose only necessary ports
4. **Monitor usage**: Public URLs can be accessed by anyone

## Files

- `server.py` - Flask web server
- `api.py` - REST API endpoints
- `frontend/` - React application
- `web_with_ngrok.bat` - Windows batch script
- `web_with_ngrok.ps1` - PowerShell script
- `install_windows_service.bat` - Service installer
- `manage_service.bat` - Service manager

## License

Part of OpenCode Monitor project. See main LICENSE file.