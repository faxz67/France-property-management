const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
require('dotenv').config();

const { testConnection, syncDatabase } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admins');
const propertyRoutes = require('./routes/properties');
const tenantRoutes = require('./routes/tenants');

const app = express();
const PORT = process.env.PORT || 4000;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  }
});

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - Increased limits for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased to 1000 requests per windowMs for development
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Property Management API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/tenants', tenantRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  // Sequelize unique constraint errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      error: 'Duplicate entry',
      details: error.errors.map(err => ({
        field: err.path,
        message: `${err.path} already exists`
      }))
    });
  }
  
  // Sequelize foreign key constraint errors
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid reference',
      message: 'Referenced record does not exist'
    });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database (create tables if they don't exist)
    await syncDatabase();
    
    // Start listening
    app.listen(PORT, () => {
      console.log('========================================');
      console.log('🚀 Property Management API Server');
      console.log('========================================');
      console.log(`📍 Status: Running`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🎯 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log('========================================');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
