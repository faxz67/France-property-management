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
const {
  uploadTenantDocuments: uploadDocumentsController,
  getTenantDocuments,
  deleteTenantDocument,
  updateDocumentType
} = require('../controllers/tenantDocumentController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { 
  validateTenant, 
  validateId, 
  validatePagination 
} = require('../middleware/validation');
const { uploadTenantDocuments } = require('../utils/fileUpload');

// All routes require authentication and admin privileges
router.use(verifyToken, isAdmin);

// Tenant management routes
router.get('/', validatePagination, getAllTenants);
router.get('/stats', getTenantStats);
router.get('/:id', validateId, getTenantById);
router.post('/', validateTenant, createTenant);
router.put('/:id', validateId, validateTenant, updateTenant);
router.delete('/:id', validateId, deleteTenant);

// Tenant documents routes
router.post('/:tenantId/documents', uploadTenantDocuments.array('documents', 10), uploadDocumentsController);
router.get('/:tenantId/documents', getTenantDocuments);
router.delete('/:tenantId/documents/:documentId', deleteTenantDocument);
router.put('/:tenantId/documents/:documentId', updateDocumentType);

module.exports = router;
