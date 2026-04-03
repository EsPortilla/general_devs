#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

echo ""
echo "============================================"
echo "   Event Registration System - Installer   "
echo "============================================"
echo ""

# ── 1. Check Node.js ──────────────────────────────────────────────────────────
info "Checking Node.js..."
if ! command -v node &>/dev/null; then
    error "Node.js is not installed. Please install Node.js 16 or higher from https://nodejs.org and re-run this script."
fi

NODE_VERSION=$(node -e "process.exit(parseInt(process.versions.node.split('.')[0]))" 2>/dev/null; echo $?)
NODE_MAJOR=$(node -e "console.log(parseInt(process.versions.node.split('.')[0]))")
if [ "$NODE_MAJOR" -lt 16 ]; then
    error "Node.js 16 or higher is required (found $(node -v)). Please upgrade."
fi
success "Node.js $(node -v) detected."

# ── 2. Check npm ──────────────────────────────────────────────────────────────
if ! command -v npm &>/dev/null; then
    error "npm is not installed. Please install npm and re-run this script."
fi
success "npm $(npm -v) detected."

# ── 3. Determine script directory (repo root) ─────────────────────────────────
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
info "Repository root: $REPO_DIR"

# ── 4. Install backend dependencies ──────────────────────────────────────────
info "Installing backend dependencies..."
(cd "$REPO_DIR/backend" && npm install --silent)
success "Backend dependencies installed."

# ── 5. Set up .env file ───────────────────────────────────────────────────────
ENV_FILE="$REPO_DIR/.env"
ENV_EXAMPLE="$REPO_DIR/.env.example"

if [ -f "$ENV_FILE" ]; then
    warn ".env file already exists — skipping copy. Edit it manually if needed."
else
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    success ".env file created from .env.example."
    echo ""
    echo -e "${YELLOW}ACTION REQUIRED:${NC} Open $ENV_FILE and fill in:"
    echo "  • EMAIL_HOST / EMAIL_USER / EMAIL_PASSWORD"
    echo "  • EVENT_NAME / EVENT_DATE / EVENT_LOCATION / EVENT_DESCRIPTION"
    echo "  • ADMIN_PASSWORD (change the default!)"
    echo ""
fi

# ── 6. Summary ────────────────────────────────────────────────────────────────
echo "============================================"
success "Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your configuration (if not done already)."
echo "  2. Start the server:"
echo "       cd $REPO_DIR/backend"
echo "       npm run dev    # development"
echo "       npm start      # production"
echo "  3. Open http://localhost:3000 in your browser."
echo ""
echo "Admin panel: http://localhost:3000/admin"
echo "============================================"
