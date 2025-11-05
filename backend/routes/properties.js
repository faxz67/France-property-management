const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyStats
} = require('../controllers/propertyController');
const {
  uploadPropertyPhotos: uploadPhotosController,
  getPropertyPhotos,
  deletePropertyPhoto,
  setPrimaryPhoto
} = require('../controllers/propertyPhotoController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { 
  validateProperty, 
  validateId, 
  validatePagination 
} = require('../middleware/validation');
const { uploadPropertyPhotos } = require('../utils/fileUpload');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch {}

// Configure multer for file uploads (disk storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + safeName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Basic image filter
    if (!file.mimetype.startsWith('image/')) return cb(null, false);
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

// Property photos routes
router.post('/:propertyId/photos', uploadPropertyPhotos.array('photos', 10), uploadPhotosController);
router.get('/:propertyId/photos', getPropertyPhotos);
router.delete('/:propertyId/photos/:photoId', deletePropertyPhoto);
router.put('/:propertyId/photos/:photoId/primary', setPrimaryPhoto);

module.exports = router;
