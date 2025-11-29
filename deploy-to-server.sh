#!/bin/bash

# =====================================
# Property Management Deployment Script
# Server: 192.168.1.109
# =====================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/property-management"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}  Property Management System - Deployment${NC}"
echo -e "${BLUE}  Server: 192.168.1.109${NC}"
echo -e "${BLUE}=================================================${NC}\n"

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root"
    exit 1
fi

# =====================================
# Phase 1: Prerequisites Check
# =====================================
print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) installed"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 is not installed. Installing..."
    sudo npm install -g pm2
    print_success "PM2 installed"
else
    print_success "PM2 $(pm2 -v) installed"
fi

# Check Nginx
if ! command -v nginx &> /dev/null; then
    print_error "Nginx is not installed. Please run: sudo apt install nginx -y"
    exit 1
fi
print_success "Nginx installed"

# Check MariaDB/MySQL
if ! command -v mysql &> /dev/null; then
    print_error "MySQL/MariaDB is not installed. Please run: sudo apt install mariadb-server -y"
    exit 1
fi
print_success "MySQL/MariaDB installed"

# =====================================
# Phase 2: Application Directory Setup
# =====================================
print_status "Setting up application directories..."

if [ ! -d "$APP_DIR" ]; then
    print_warning "Application directory doesn't exist. Creating..."
    sudo mkdir -p $APP_DIR
    sudo chown -R $USER:$USER $APP_DIR
    print_success "Application directory created: $APP_DIR"
else
    print_success "Application directory exists: $APP_DIR"
fi

# =====================================
# Phase 3: Backend Setup
# =====================================
print_status "Setting up backend..."

if [ ! -d "$BACKEND_DIR" ]; then
    print_error "Backend directory not found: $BACKEND_DIR"
    print_warning "Please transfer backend files to the server first"
    exit 1
fi

cd $BACKEND_DIR

# Check for .env file
if [ ! -f ".env" ]; then
    print_warning ".env file not found"
    if [ -f "env.production.template" ]; then
        print_status "Creating .env from template..."
        cp env.production.template .env
        print_warning "Please edit .env file and update:"
        print_warning "  - DB_PASSWORD"
        print_warning "  - JWT_SECRET"
        print_warning "  - SESSION_SECRET"
        print_warning ""
        print_warning "Run these commands to generate secrets:"
        print_warning "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
        print_warning ""
        read -p "Press Enter after updating .env file..."
    else
        print_error "env.production.template not found"
        exit 1
    fi
fi

# Install dependencies
print_status "Installing backend dependencies..."
npm install --production
print_success "Backend dependencies installed"

# Create uploads directory
print_status "Creating uploads directory..."
mkdir -p public/uploads
chmod -R 755 public/uploads
print_success "Uploads directory created"

# Database sync
print_status "Synchronizing database..."
if node scripts/sync-database.js; then
    print_success "Database synchronized"
else
    print_error "Database synchronization failed"
    print_warning "Please check your database credentials in .env"
    exit 1
fi

# Start with PM2
print_status "Starting backend with PM2..."
pm2 delete property-backend 2>/dev/null || true
pm2 start server.js --name property-backend
pm2 save
print_success "Backend started with PM2"

# =====================================
# Phase 4: Frontend Setup
# =====================================
print_status "Setting up frontend..."

if [ ! -d "$FRONTEND_DIR/dist" ]; then
    print_error "Frontend dist directory not found: $FRONTEND_DIR/dist"
    print_warning "Please transfer frontend/dist files to the server first"
    exit 1
fi

print_success "Frontend files found"

# =====================================
# Phase 5: Nginx Configuration
# =====================================
print_status "Configuring Nginx..."

NGINX_CONF="$APP_DIR/nginx.conf"
if [ ! -f "$NGINX_CONF" ]; then
    print_error "Nginx configuration file not found: $NGINX_CONF"
    exit 1
fi

sudo cp $NGINX_CONF /etc/nginx/sites-available/property-management
sudo ln -sf /etc/nginx/sites-available/property-management /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "Testing Nginx configuration..."
if sudo nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Restart Nginx
print_status "Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx
print_success "Nginx restarted and enabled"

# =====================================
# Phase 6: Firewall Configuration
# =====================================
print_status "Configuring firewall..."

if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 4002/tcp
    sudo ufw --force enable
    print_success "Firewall configured"
else
    print_warning "UFW not found, skipping firewall configuration"
fi

# =====================================
# Phase 7: PM2 Startup Configuration
# =====================================
print_status "Configuring PM2 to start on boot..."
PM2_STARTUP=$(pm2 startup | grep "sudo env PATH" | tail -1)
if [ ! -z "$PM2_STARTUP" ]; then
    eval $PM2_STARTUP
    print_success "PM2 startup configured"
else
    print_warning "Could not configure PM2 startup automatically"
    print_warning "Please run: pm2 startup"
fi

# =====================================
# Phase 8: Verification
# =====================================
print_status "Verifying deployment..."

# Check PM2 status
echo ""
pm2 status

# Check backend
echo ""
print_status "Testing backend..."
sleep 2
if curl -s http://localhost:4002/api/auth/login > /dev/null; then
    print_success "Backend is responding on port 4002"
else
    print_error "Backend is not responding"
fi

# Check frontend
print_status "Testing frontend..."
if curl -s http://localhost/ > /dev/null; then
    print_success "Frontend is accessible through Nginx"
else
    print_error "Frontend is not accessible"
fi

# =====================================
# Deployment Complete
# =====================================
echo ""
echo -e "${GREEN}=================================================${NC}"
echo -e "${GREEN}  Deployment Completed Successfully!${NC}"
echo -e "${GREEN}=================================================${NC}"
echo ""
echo -e "${BLUE}Access Information:${NC}"
echo -e "  Frontend: ${GREEN}http://192.168.1.109${NC}"
echo -e "  Backend API: ${GREEN}http://192.168.1.109:4002/api${NC}"
echo ""
echo -e "${BLUE}Management Commands:${NC}"
echo -e "  PM2 Status:  ${YELLOW}pm2 status${NC}"
echo -e "  PM2 Logs:    ${YELLOW}pm2 logs property-backend${NC}"
echo -e "  PM2 Restart: ${YELLOW}pm2 restart property-backend${NC}"
echo -e "  PM2 Monitor: ${YELLOW}pm2 monit${NC}"
echo ""
echo -e "  Nginx Status:  ${YELLOW}sudo systemctl status nginx${NC}"
echo -e "  Nginx Restart: ${YELLOW}sudo systemctl restart nginx${NC}"
echo -e "  Nginx Logs:    ${YELLOW}sudo tail -f /var/log/nginx/property-management-error.log${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. Open browser: ${GREEN}http://192.168.1.109${NC}"
echo -e "  2. Test login functionality"
echo -e "  3. Verify all features work correctly"
echo -e "  4. Setup database backups (see DEPLOYMENT_GUIDE.md)"
echo ""
echo -e "${YELLOW}For detailed documentation, see:${NC}"
echo -e "  - DEPLOYMENT_GUIDE.md"
echo -e "  - QUICK_DEPLOY_REFERENCE.md"
echo ""

