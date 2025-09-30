const express = require('express');
const router = express.Router();
const {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantStats
} = require('../controllers/tenantController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { 
  validateTenant, 
  validateId, 
  validatePagination 
} = require('../middleware/validation');

// All routes require authentication and admin privileges
router.use(verifyToken, isAdmin);

// Tenant management routes
router.get('/', validatePagination, getAllTenants);
router.get('/stats', getTenantStats);
router.get('/:id', validateId, getTenantById);
router.post('/', validateTenant, createTenant);
router.put('/:id', validateId, validateTenant, updateTenant);
router.delete('/:id', validateId, deleteTenant);

module.exports = router;
