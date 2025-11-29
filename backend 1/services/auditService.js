const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

/**
 * Audit Trail Service
 * Logs all sensitive actions for security and compliance
 */

// In-memory audit log (in production, use database table)
const auditLogs = [];

/**
 * Log an audit event
 * @param {Object} options - Audit log options
 * @param {Number} options.adminId - Admin ID who performed the action
 * @param {String} options.action - Action performed (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.)
 * @param {String} options.resource - Resource type (PROPERTY, TENANT, BILL, ADMIN, etc.)
 * @param {Number} options.resourceId - ID of the resource affected
 * @param {String} options.ipAddress - IP address of the requester
 * @param {String} options.userAgent - User agent string
 * @param {Object} options.details - Additional details about the action
 * @param {String} options.status - Status (SUCCESS, FAILED)
 */
async function logAuditEvent({
  adminId,
  action,
  resource,
  resourceId = null,
  ipAddress = null,
  userAgent = null,
  details = {},
  status = 'SUCCESS'
}) {
  try {
    const auditEntry = {
      id: auditLogs.length + 1,
      adminId,
      action,
      resource,
      resourceId,
      ipAddress,
      userAgent,
      details: JSON.stringify(details),
      status,
      timestamp: new Date().toISOString(),
      createdAt: new Date()
    };
    
    auditLogs.push(auditEntry);
    
    // Keep only last 10000 entries in memory
    if (auditLogs.length > 10000) {
      auditLogs.shift();
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📋 Audit: ${action} ${resource}${resourceId ? ` #${resourceId}` : ''} by Admin #${adminId} - ${status}`);
    }
    
    return auditEntry;
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't throw - audit logging should not break the application
    return null;
  }
}

/**
 * Get audit logs with filters
 * @param {Object} filters - Filter options
 * @returns {Array} Audit logs
 */
function getAuditLogs(filters = {}) {
  let logs = [...auditLogs];
  
  if (filters.adminId) {
    logs = logs.filter(log => log.adminId === filters.adminId);
  }
  
  if (filters.action) {
    logs = logs.filter(log => log.action === filters.action);
  }
  
  if (filters.resource) {
    logs = logs.filter(log => log.resource === filters.resource);
  }
  
  if (filters.status) {
    logs = logs.filter(log => log.status === filters.status);
  }
  
  if (filters.startDate) {
    logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
  }
  
  if (filters.endDate) {
    logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
  }
  
  // Sort by timestamp descending
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Limit results
  const limit = filters.limit || 100;
  return logs.slice(0, limit);
}

/**
 * Get audit statistics
 */
function getAuditStats() {
  const stats = {
    total: auditLogs.length,
    byAction: {},
    byResource: {},
    byStatus: {},
    recentFailures: auditLogs.filter(log => 
      log.status === 'FAILED' && 
      new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length
  };
  
  auditLogs.forEach(log => {
    stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
    stats.byResource[log.resource] = (stats.byResource[log.resource] || 0) + 1;
    stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
  });
  
  return stats;
}

/**
 * Middleware to automatically log requests
 */
function auditMiddleware(req, res, next) {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log after response is sent
    if (req.admin && req.method !== 'GET') {
      const action = getActionFromMethod(req.method);
      const resource = getResourceFromPath(req.path);
      
      logAuditEvent({
        adminId: req.admin.id,
        action,
        resource,
        resourceId: req.params.id ? parseInt(req.params.id) : null,
        ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0],
        userAgent: req.headers['user-agent'],
        details: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode
        },
        status: res.statusCode >= 200 && res.statusCode < 400 ? 'SUCCESS' : 'FAILED'
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

function getActionFromMethod(method) {
  const map = {
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE',
    'GET': 'READ'
  };
  return map[method] || 'UNKNOWN';
}

function getResourceFromPath(path) {
  if (path.includes('/properties')) return 'PROPERTY';
  if (path.includes('/tenants')) return 'TENANT';
  if (path.includes('/bills')) return 'BILL';
  if (path.includes('/admins')) return 'ADMIN';
  if (path.includes('/expenses')) return 'EXPENSE';
  if (path.includes('/analytics')) return 'ANALYTICS';
  return 'UNKNOWN';
}

module.exports = {
  logAuditEvent,
  getAuditLogs,
  getAuditStats,
  auditMiddleware
};

