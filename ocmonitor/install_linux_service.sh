#!/bin/bash

echo "Installing OpenCode Monitor Web UI as systemd service..."
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run this script as root (use sudo)"
    exit 1
fi

# Check if systemd is available
if ! command -v systemctl &> /dev/null; then
    echo "Error: systemd is not available on this system"
    exit 1
fi

# Get current user (to run service as)
CURRENT_USER=$(logname)
CURRENT_GROUP=$(id -gn $CURRENT_USER)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create systemd service file for web UI
cat > /etc/systemd/system/ocmonitor-web.service << EOF
[Unit]
Description=OpenCode Monitor Web Dashboard
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
Group=$CURRENT_GROUP
WorkingDirectory=$SCRIPT_DIR
ExecStart=/usr/local/bin/ocmonitor web --port 9394 --no-browser
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service file for ngrok
cat > /etc/systemd/system/ocmonitor-ngrok.service << EOF
[Unit]
Description=Ngrok tunnel for OpenCode Monitor Web UI
After=ocmonitor-web.service
Requires=ocmonitor-web.service

[Service]
Type=simple
User=$CURRENT_USER
Group=$CURRENT_GROUP
WorkingDirectory=$SCRIPT_DIR
ExecStart=/usr/local/bin/ngrok http 9394
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

echo "Services created successfully!"
echo ""
echo "To start services:"
echo "  sudo systemctl start ocmonitor-web"
echo "  sudo systemctl start ocmonitor-ngrok"
echo ""
echo "To enable auto-start on boot:"
echo "  sudo systemctl enable ocmonitor-web"
echo "  sudo systemctl enable ocmonitor-ngrok"
echo ""
echo "To check status:"
echo "  sudo systemctl status ocmonitor-web"
echo "  sudo systemctl status ocmonitor-ngrok"
echo ""
echo "To view logs:"
echo "  sudo journalctl -u ocmonitor-web -f"
echo "  sudo journalctl -u ocmonitor-ngrok -f"
echo ""
echo "To stop services:"
echo "  sudo systemctl stop ocmonitor-ngrok"
echo "  sudo systemctl stop ocmonitor-web"
echo ""
echo "To remove services:"
echo "  sudo systemctl disable ocmonitor-ngrok"
echo "  sudo systemctl disable ocmonitor-web"
echo "  sudo rm /etc/systemd/system/ocmonitor-*.service"
echo "  sudo systemctl daemon-reload"