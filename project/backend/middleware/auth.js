const jwt = require('jsonwebtoken');
const { Admin } = require('../models');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. Admin not found.'
      });
    }

    if (admin.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        error: 'Account is inactive.'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired.'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error.'
    });
  }
};

// Check if admin has SUPER_ADMIN role
const isSuperAdmin = (req, res, next) => {
  if (req.admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Super admin privileges required.'
    });
  }
  next();
};

// Check if admin has ADMIN or SUPER_ADMIN role
const isAdmin = (req, res, next) => {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(req.admin.role)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Check if admin can access resource (ownership check)
const checkOwnership = (resourceType) => {
  return (req, res, next) => {
    const resourceId = req.params.id;
    const adminId = req.admin.id;
    const adminRole = req.admin.role;

    // SUPER_ADMIN can access all resources
    if (adminRole === 'SUPER_ADMIN') {
      return next();
    }

    // For ADMIN, check if they own the resource
    if (adminRole === 'ADMIN') {
      // The ownership check will be done in the controller
      // by checking the admin_id field of the resource
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Access denied. Insufficient privileges.'
    });
  };
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await Admin.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (admin && admin.status === 'ACTIVE') {
        req.admin = admin;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  verifyToken,
  isSuperAdmin,
  isAdmin,
  checkOwnership,
  optionalAuth
};
