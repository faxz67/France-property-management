#!/bin/bash

# Deployment Script for Property Management System
# Linux Server with Nginx + PM2
# Usage: ./deploy.sh

set -e  # Exit on error

echo "=========================================="
echo "🚀 Property Management System Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/property-management"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
NGINX_CONFIG="/etc/nginx/sites-available/property-management"
NGINX_ENABLED="/etc/nginx/sites-enabled/property-management"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or use sudo${NC}"
    exit 1
fi

echo ""
echo "📋 Step 1: Installing dependencies..."
echo "=========================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 not found. Installing...${NC}"
    npm install -g pm2
    pm2 startup
fi

# Check Nginx
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Nginx not found. Installing...${NC}"
    apt-get update
    apt-get install -y nginx
fi

echo ""
echo "📦 Step 2: Setting up project structure..."
echo "=========================================="

# Create project directory
mkdir -p $PROJECT_DIR
mkdir -p $BACKEND_DIR/logs
mkdir -p $FRONTEND_DIR/dist

# Copy project files (assuming you're running from project root)
if [ -d "backend" ] && [ -d "frontend" ]; then
    echo "Copying backend files..."
    cp -r backend/* $BACKEND_DIR/
    
    echo "Copying frontend files..."
    cp -r frontend/* $FRONTEND_DIR/
else
    echo -e "${RED}Backend and frontend directories not found in current location${NC}"
    exit 1
fi

echo ""
echo "🔧 Step 3: Building frontend..."
echo "=========================================="

cd $FRONTEND_DIR
npm install
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}Frontend build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Frontend built successfully${NC}"

echo ""
echo "🔧 Step 4: Installing backend dependencies..."
echo "=========================================="

cd $BACKEND_DIR
npm install --production

echo ""
echo "🗄️  Step 5: Setting up database..."
echo "=========================================="

# Check if .env exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${YELLOW}Creating .env file from env.example...${NC}"
    cp env.example .env
    echo -e "${YELLOW}⚠️  Please edit $BACKEND_DIR/.env with your production settings${NC}"
fi

# Run database migrations
echo "Running database sync..."
node -e "const { testConnection, syncDatabase } = require('./models'); (async () => { await testConnection(); await syncDatabase(); process.exit(0); })();" || {
    echo -e "${YELLOW}Database sync completed (warnings are normal)${NC}"
}

echo ""
echo "⚙️  Step 6: Configuring PM2..."
echo "=========================================="

cd $BACKEND_DIR

# Stop existing PM2 process if running
pm2 stop property-backend 2>/dev/null || true
pm2 delete property-backend 2>/dev/null || true

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save

echo -e "${GREEN}Backend started with PM2${NC}"

echo ""
echo "🌐 Step 7: Configuring Nginx..."
echo "=========================================="

# Copy nginx configuration
if [ -f "$PROJECT_DIR/nginx.conf" ]; then
    cp $PROJECT_DIR/nginx.conf $NGINX_CONFIG
else
    echo -e "${RED}nginx.conf not found in project directory${NC}"
    exit 1
fi

# Enable site
ln -sf $NGINX_CONFIG $NGINX_ENABLED

# Test Nginx configuration
nginx -t

if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo -e "${GREEN}Nginx configured and reloaded${NC}"
else
    echo -e "${RED}Nginx configuration test failed!${NC}"
    exit 1
fi

echo ""
echo "✅ Step 8: Final checks..."
echo "=========================================="

# Check PM2 status
pm2 status property-backend

# Check Nginx status
systemctl status nginx --no-pager -l

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo "=========================================="
echo ""
echo "📋 Service Information:"
echo "  - Frontend: http://your-server-ip (or domain)"
echo "  - Backend API: http://your-server-ip/api"
echo "  - PM2 Status: pm2 status"
echo "  - PM2 Logs: pm2 logs property-backend"
echo "  - Nginx Status: systemctl status nginx"
echo ""
echo "📝 Next Steps:"
echo "  1. Edit $BACKEND_DIR/.env with production settings"
echo "  2. Update server_name in $NGINX_CONFIG"
echo "  3. Configure SSL certificates for HTTPS (optional)"
echo "  4. Set up firewall rules (ufw allow 80/tcp, ufw allow 443/tcp)"
echo ""

