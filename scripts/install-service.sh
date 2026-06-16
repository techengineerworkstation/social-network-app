#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Social Network App — Systemd Service Installer
# ─────────────────────────────────────────────────────────────
# Installs and enables the systemd service for auto-start.
#
# Usage:
#   chmod +x scripts/install-service.sh
#   ./scripts/install-service.sh
# ─────────────────────────────────────────────────────────────

set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE_NAME="social-network-app@$(whoami)"
SERVICE_FILE="$APP_DIR/scripts/social-network-app@.service"
WRAPPER_SRC="$APP_DIR/scripts/start-app.sh"
WRAPPER_DST="/usr/local/bin/social-network-app"
SYSTEMD_DIR="/etc/systemd/system"

echo "╔══════════════════════════════════════════════════════╗"
echo "║   Social Network App — Service Installer            ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  App directory: $APP_DIR"
echo "  Service name:  $SERVICE_NAME"
echo ""

# Step 1: Build for production
echo "▶ Step 1: Building for production..."
cd "$APP_DIR"
npm run build
echo "✓ Build complete"
echo ""

# Step 2: Install wrapper script to /usr/local/bin
echo "▶ Step 2: Installing wrapper script..."
sudo cp "$WRAPPER_SRC" "$WRAPPER_DST"
sudo chmod +x "$WRAPPER_DST"
echo "✓ Wrapper installed at $WRAPPER_DST"
echo ""

# Step 3: Install systemd service
echo "▶ Step 3: Installing systemd service..."
sed "s|%i|$(whoami)|g" "$SERVICE_FILE" | sudo tee "$SYSTEMD_DIR/$SERVICE_NAME.service" > /dev/null
sudo systemctl daemon-reload
echo "✓ Service installed"
echo ""

# Step 4: Enable and start
echo "▶ Step 4: Enabling and starting service..."
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl start "$SERVICE_NAME"
echo "✓ Service enabled and started"
echo ""

# Step 5: Verify
echo "▶ Step 5: Verifying..."
sleep 4
if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
  echo "✓ Service is running"
  echo ""
  sudo systemctl status "$SERVICE_NAME" --no-pager -l
else
  echo "✗ Service failed to start. Check logs:"
  echo "  journalctl -u $SERVICE_NAME -n 20 --no-pager"
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   Installation complete!                            ║"
echo "║                                                     ║"
echo "║   The app will start automatically on boot.         ║"
echo "║                                                     ║"
echo "║   Manage the service:                               ║"
echo "║     systemctl status  $SERVICE_NAME    ║"
echo "║     systemctl restart $SERVICE_NAME    ║"
echo "║     systemctl stop    $SERVICE_NAME    ║"
echo "║     journalctl -u $SERVICE_NAME -f     ║"
echo "╚══════════════════════════════════════════════════════╝"
