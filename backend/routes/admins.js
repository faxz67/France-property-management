const express = require('express');
const router = express.Router();
const {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAdminStats
} = require('../controllers/adminController');
const { verifyToken, isSuperAdmin } = require('../middleware/auth');
const { 
  validateAdmin, 
  validateAdminUpdate, 
  validateId, 
  validatePagination 
} = require('../middleware/validation');

// All routes require authentication and super admin privileges
router.use(verifyToken, isSuperAdmin);

// Admin management routes
router.get('/', validatePagination, getAllAdmins);
router.get('/stats', getAdminStats);
router.get('/:id', validateId, getAdminById);
router.post('/', validateAdmin, createAdmin);
router.put('/:id', validateId, validateAdminUpdate, updateAdmin);
router.delete('/:id', validateId, deleteAdmin);

module.exports = router;
