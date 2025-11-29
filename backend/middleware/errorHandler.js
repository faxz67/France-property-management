/**
 * Error Handling Middleware
 * 
 * Gestion centralisée des erreurs
 * Remplace les blocs try/catch répétitifs
 */

const logger = require('../utils/logger');

/**
 * Custom Application Error
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Set defaults
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Log error
  const errorLog = {
    message: err.message,
    statusCode: err.statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    adminId: req.admin?.id,
    timestamp: new Date().toISOString()
  };

  // Log based on severity
  if (err.statusCode >= 500) {
    logger.error('Server Error', {
      ...errorLog,
      stack: err.stack
    });
  } else if (err.statusCode >= 400) {
    logger.warn('Client Error', errorLog);
  }

  // Prepare response
  const errorResponse = {
    success: false,
    error: err.message,
    timestamp: err.timestamp
  };

  // Add details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details;
  }

  // Send response
  res.status(err.statusCode).json(errorResponse);
};

/**
 * Async Handler Wrapper
 * Évite d'écrire try/catch dans chaque route
 * 
 * Usage:
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.findAll();
 *   res.json(users);
 * }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.url}`,
    404
  );
  next(error);
};

/**
 * Validation Error Handler
 */
const validationErrorHandler = (errors) => {
  const message = errors.map(err => err.msg).join(', ');
  return new AppError(`Validation Error: ${message}`, 400, true, errors);
};

/**
 * Database Error Handler
 */
const handleDatabaseError = (error) => {
  // Sequelize unique constraint error
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0].path;
    return new AppError(`${field} already exists`, 409);
  }

  // Sequelize validation error
  if (error.name === 'SequelizeValidationError') {
    const message = error.errors.map(err => err.message).join(', ');
    return new AppError(`Validation Error: ${message}`, 400);
  }

  // Foreign key constraint error
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return new AppError('Cannot perform operation due to related data', 409);
  }

  // Database connection error
  if (error.name === 'SequelizeConnectionError') {
    return new AppError('Database connection error', 503, false);
  }

  // Generic database error
  return new AppError('Database error occurred', 500, false);
};

/**
 * JWT Error Handler
 */
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AppError('Invalid token', 401);
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AppError('Token expired', 401);
  }
  
  return new AppError('Authentication error', 401);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  validationErrorHandler,
  handleDatabaseError,
  handleJWTError
};

