#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo " OCMonitor - Build UI and Install"
echo "============================================"
echo ""

# Step 1: Build React frontend
echo "[1/3] Building React frontend..."
cd "$SCRIPT_DIR/ocmonitor/web/frontend"
if [ ! -d node_modules ]; then
    echo "     Installing npm dependencies..."
    npm install
fi
npm run build
echo "     Frontend build complete."
echo ""

# Step 2: Install package in editable mode
echo "[2/3] Installing ocmonitor package..."
cd "$SCRIPT_DIR"
pip install -e . > /dev/null 2>&1
echo "     Package installed."
echo ""

# Step 3: Copy ocmonitor to target
echo "[3/3] Installing ocmonitor binary..."

DEST="$HOME/.local/bin/ocmonitor"
SRC=""

# Try nt_user first (Windows / Git Bash / MSYS2)
NT_DIR=$(python -c "import sysconfig; print(sysconfig.get_path('scripts', 'nt_user'))" 2>/dev/null || true)
if [ -n "$NT_DIR" ] && [ -f "$NT_DIR/ocmonitor.exe" ]; then
    SRC="$NT_DIR/ocmonitor.exe"
    DEST="$HOME/.local/bin/ocmonitor.exe"
fi

# Try posix_user (Linux / macOS)
if [ -z "$SRC" ]; then
    POSIX_DIR=$(python3 -c "import sysconfig; print(sysconfig.get_path('scripts', 'posix_user'))" 2>/dev/null || true)
    if [ -n "$POSIX_DIR" ] && [ -f "$POSIX_DIR/ocmonitor" ]; then
        SRC="$POSIX_DIR/ocmonitor"
    fi
fi

# Fallback: which / where
if [ -z "$SRC" ]; then
    SRC=$(command -v ocmonitor 2>/dev/null || true)
    # On Windows check for .exe variant
    if [ -z "$SRC" ]; then
        SRC=$(command -v ocmonitor.exe 2>/dev/null || true)
        if [ -n "$SRC" ]; then
            DEST="$HOME/.local/bin/ocmonitor.exe"
        fi
    fi
fi

if [ -z "$SRC" ]; then
    echo "ERROR: Could not find ocmonitor binary"
    echo "       Looked in:"
    [ -n "$NT_DIR" ]    && echo "         $NT_DIR"
    [ -n "$POSIX_DIR" ] && echo "         $POSIX_DIR"
    echo "         \$PATH"
    exit 1
fi

mkdir -p "$(dirname "$DEST")"
cp -f "$SRC" "$DEST"
chmod +x "$DEST"
echo "     Installed: $DEST"
echo ""

echo "============================================"
echo " Done! Run: ocmonitor web"
echo "============================================"
