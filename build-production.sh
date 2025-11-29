#!/bin/bash

# Build Script for Production
# Prepares both frontend and backend for deployment

set -e

echo "=========================================="
echo "🔨 Building for Production"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Build Frontend
echo ""
echo "📦 Building Frontend..."
echo "=========================================="

cd frontend

# Clean previous build
rm -rf dist
rm -rf node_modules/.vite

# Install dependencies
echo "Installing dependencies..."
npm install

# Build
echo "Building production bundle..."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend built successfully${NC}"
echo "Build size:"
du -sh dist

cd ..

# Prepare Backend
echo ""
echo "📦 Preparing Backend..."
echo "=========================================="

cd backend

# Install production dependencies only
echo "Installing production dependencies..."
npm install --production

# Create logs directory
mkdir -p logs

# Create uploads directory structure
mkdir -p public/uploads

echo -e "${GREEN}✅ Backend prepared${NC}"

cd ..

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo "=========================================="
echo ""
echo "📁 Production-ready files:"
echo "  - Frontend: frontend/dist/"
echo "  - Backend: backend/"
echo ""
echo "📋 Next steps:"
echo "  1. Upload project folder to your server"
echo "  2. Run deploy.sh on the server"
echo "  3. Configure .env file with production settings"
echo ""

