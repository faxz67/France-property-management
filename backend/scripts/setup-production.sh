#!/bin/bash

# Production Setup Script for Backend
# Sets up environment, dependencies, and PM2 configuration

set -e

echo "=========================================="
echo "🚀 Production Setup - Backend"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env from env.example..."
    cp env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env with your production settings!${NC}"
    echo ""
fi

# Install dependencies
echo "📦 Installing production dependencies..."
npm install --production

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p public/uploads

# Set permissions
chmod -R 775 public/uploads
chmod -R 755 logs

# Test database connection
echo "🗄️  Testing database connection..."
node -e "const { testConnection } = require('./models'); testConnection().then(() => { console.log('✅ Database connection successful'); process.exit(0); }).catch(e => { console.error('❌ Database connection failed:', e.message); process.exit(1); });"

# Sync database
echo "🔄 Syncing database..."
node -e "const { syncDatabase } = require('./models'); syncDatabase().then(() => { console.log('✅ Database synced'); process.exit(0); }).catch(e => { console.error('⚠️  Database sync warning:', e.message); process.exit(0); });"

# Setup PM2
echo ""
echo "⚙️  Setting up PM2..."
echo "=========================================="

# Stop existing process
pm2 stop property-backend 2>/dev/null || true
pm2 delete property-backend 2>/dev/null || true

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save

# Setup PM2 startup
echo "Configuring PM2 startup..."
pm2 startup systemd -u $USER --hp $HOME

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Production setup completed!${NC}"
echo "=========================================="
echo ""
echo "📋 PM2 Commands:"
echo "  pm2 status                 # Check status"
echo "  pm2 logs property-backend   # View logs"
echo "  pm2 restart property-backend # Restart"
echo "  pm2 monit                  # Monitor resources"
echo ""

