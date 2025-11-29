const rateLimit = require('express-rate-limit');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// In-memory store for blocked IPs (in production, use Redis)
const blockedIPs = new Map();
const failedLoginAttempts = new Map();

/**
 * Enhanced rate limiting for authentication endpoints
 * Stricter limits to prevent brute force attacks
 */
const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 login attempts per 15 minutes per IP
  message: {
    success: false,
    error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    console.warn(`🚨 Rate limit exceeded for IP: ${ip} on ${req.path}`);
    
    // Track failed attempts
    const attempts = failedLoginAttempts.get(ip) || 0;
    failedLoginAttempts.set(ip, attempts + 1);
    
    // Block IP after 3 rate limit violations
    if (attempts >= 2) {
      blockIP(ip, 30 * 60 * 1000); // Block for 30 minutes
      console.warn(`🔒 IP ${ip} blocked for 30 minutes due to repeated violations`);
    }
    
    res.status(429).json({
      success: false,
      error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
    });
  }
});

/**
 * Block an IP address temporarily
 */
function blockIP(ip, durationMs) {
  const expiry = Date.now() + durationMs;
  blockedIPs.set(ip, expiry);
  
  // Auto-unblock after duration
  setTimeout(() => {
    blockedIPs.delete(ip);
    failedLoginAttempts.delete(ip);
  }, durationMs);
}

/**
 * Check if an IP is blocked
 */
function isIPBlocked(ip) {
  const expiry = blockedIPs.get(ip);
  if (!expiry) return false;
  
  if (Date.now() > expiry) {
    blockedIPs.delete(ip);
    failedLoginAttempts.delete(ip);
    return false;
  }
  
  return true;
}

/**
 * Middleware to check if IP is blocked
 */
const checkIPBlock = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0];
  
  if (isIPBlocked(ip)) {
    console.warn(`🚫 Blocked IP attempt: ${ip}`);
    return res.status(403).json({
      success: false,
      error: 'Votre adresse IP est temporairement bloquée en raison de tentatives suspectes.'
    });
  }
  
  next();
};

/**
 * Reset failed login attempts on successful login
 */
function resetFailedAttempts(ip) {
  failedLoginAttempts.delete(ip);
}

/**
 * Record failed login attempt
 */
function recordFailedAttempt(ip, email) {
  const attempts = failedLoginAttempts.get(ip) || 0;
  failedLoginAttempts.set(ip, attempts + 1);
  
  console.warn(`⚠️ Failed login attempt #${attempts + 1} from IP: ${ip} for email: ${email}`);
  
  // Block after 10 failed attempts
  if (attempts >= 9) {
    blockIP(ip, 60 * 60 * 1000); // Block for 1 hour
    console.error(`🔒 IP ${ip} blocked for 1 hour after 10 failed login attempts`);
  }
}

/**
 * Input sanitization middleware
 * Removes potentially dangerous characters and scripts
 */
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove script tags and dangerous HTML
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    } else if (Array.isArray(obj)) {
      return obj.map(sanitize);
    } else if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  if (req.params) {
    req.params = sanitize(req.params);
  }
  
  next();
};

/**
 * File upload validation middleware
 */
const validateFileUpload = (allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }
    
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    
    for (const file of files) {
      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: `Type de fichier non autorisé. Types autorisés: ${allowedTypes.join(', ')}`
        });
      }
      
      // Check file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: 'Le fichier est trop volumineux. Taille maximale: 10MB'
        });
      }
      
      // Check for malicious file names
      const dangerousPatterns = /[<>:"|?*\x00-\x1f]/;
      if (dangerousPatterns.test(file.originalname)) {
        return res.status(400).json({
          success: false,
          error: 'Nom de fichier invalide'
        });
      }
    }
    
    next();
  };
};

/**
 * Request ID middleware for tracking
 */
const requestId = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || 
                  `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

module.exports = {
  strictAuthLimiter,
  checkIPBlock,
  resetFailedAttempts,
  recordFailedAttempt,
  sanitizeInput,
  validateFileUpload,
  requestId,
  securityHeaders,
  isIPBlocked,
  blockIP
};

