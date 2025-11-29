const express = require('express');
const router = express.Router();
const { verifyToken, isSuperAdmin } = require('../middleware/auth');
const { getAuditLogs, getAuditStats } = require('../services/auditService');

// All audit routes require authentication and super admin privileges
router.use(verifyToken, isSuperAdmin);

// Get audit logs with filters
router.get('/logs', (req, res) => {
  try {
    const filters = {
      adminId: req.query.adminId ? parseInt(req.query.adminId) : null,
      action: req.query.action || null,
      resource: req.query.resource || null,
      status: req.query.status || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    };
    
    // Remove null values
    Object.keys(filters).forEach(key => {
      if (filters[key] === null) {
        delete filters[key];
      }
    });
    
    const logs = getAuditLogs(filters);
    
    res.json({
      success: true,
      data: {
        logs,
        count: logs.length,
        filters
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des logs d\'audit'
    });
  }
});

// Get audit statistics
router.get('/stats', (req, res) => {
  try {
    const stats = getAuditStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques d\'audit'
    });
  }
});

module.exports = router;

