const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyStats
} = require('../controllers/propertyController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { 
  validateProperty, 
  validateId, 
  validatePagination 
} = require('../middleware/validation');

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

// All routes require authentication and admin privileges
router.use(verifyToken, isAdmin);

// Property management routes
router.get('/', validatePagination, getAllProperties);
router.get('/stats', getPropertyStats);
router.get('/:id', validateId, getPropertyById);
router.post('/', upload.single('photo'), validateProperty, createProperty);
router.put('/:id', upload.single('photo'), validateId, validateProperty, updateProperty);
router.delete('/:id', validateId, deleteProperty);

module.exports = router;
