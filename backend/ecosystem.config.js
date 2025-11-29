module.exports = {
  apps: [{
    name: 'property-backend',
    script: 'server.js',
    instances: 2, // Use 2 instances for better performance (adjust based on CPU cores)
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 4002
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4002,
      // Environment variables will be loaded from .env file
      // Make sure to set these in your .env file:
      // - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
      // - JWT_SECRET, SESSION_SECRET
      // - FRONTEND_URL, BACKEND_ORIGIN
    },
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Process management
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    
    // Auto restart on file changes (development only)
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Health monitoring
    health_check_grace_period: 3000,
    
    // Session management (now production-ready!)
    // Sessions are stored in database, not memory
    // Multiple processes can share sessions
    // No more MemoryStore warnings
  }],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/property-management.git',
      path: '/var/www/property-management',
      'pre-deploy-local': '',
      'post-deploy': 'cd backend && npm install && npm run migrate-sessions && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
