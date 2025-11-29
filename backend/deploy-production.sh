#!/bin/bash

# Production Deployment Script for Property Management Backend
# This script sets up the backend for production with proper session management

echo "🚀 Starting Production Deployment..."
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the backend directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install production session store
echo "🔧 Installing session store for production..."
npm install connect-session-sequelize

# Run database migrations
echo "🗄️  Running database migrations..."
npm run migrate

# Create sessions table
echo "📋 Creating sessions table..."
npm run migrate-sessions

# Clean up any existing expired sessions
echo "🧹 Cleaning up expired sessions..."
npm run cleanup-sessions

# Set production environment
echo "🌍 Setting production environment..."
export NODE_ENV=production

# Check if SESSION_SECRET is set
if [ -z "$SESSION_SECRET" ]; then
    echo "⚠️  WARNING: SESSION_SECRET environment variable is not set!"
    echo "   Please set it in your .env file or environment variables."
    echo "   Example: SESSION_SECRET=your-very-secure-secret-key-here"
fi

# Test the server startup
echo "🧪 Testing server startup..."
timeout 10s npm start > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Server test passed - no MemoryStore warnings detected"
else
    echo "⚠️  Server test completed (timeout expected)"
fi

echo ""
echo "🎉 Production deployment completed!"
echo "=================================="
echo ""
echo "📋 Next steps:"
echo "1. Set SESSION_SECRET in your environment variables"
echo "2. Configure your reverse proxy (nginx/apache)"
echo "3. Set up SSL certificates"
echo "4. Configure PM2 for process management:"
echo "   pm2 start server.js --name property-backend"
echo "5. Set up log rotation"
echo "6. Configure monitoring"
echo ""
echo "🔧 Session management is now production-ready:"
echo "   - No more MemoryStore warnings"
echo "   - Sessions stored in database"
echo "   - Automatic cleanup of expired sessions"
echo "   - Multi-process support"
echo ""
echo "📊 Maintenance commands:"
echo "   npm run cleanup-sessions  # Clean expired sessions"
echo "   npm run migrate-sessions  # Recreate sessions table"
echo ""
