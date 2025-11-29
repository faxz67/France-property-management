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
const propertyPhotoController = require('../controllers/propertyPhotoController');
const {
  getPropertyPhotos,
  deletePropertyPhoto,
  setPrimaryPhoto
} = propertyPhotoController;
const uploadPhotosController = propertyPhotoController.uploadPropertyPhotos;
const { verifyToken, isAdmin } = require('../middleware/auth');
const { 
  validateProperty, 
  validateId, 
  validatePagination 
} = require('../middleware/validation');
const { uploadPropertyPhotos } = require('../utils/fileUpload');
const { validateFileUpload } = require('../middleware/security');

// Ensure uploads directory exists (use public/uploads to match server static serving)
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch {}

// Configure multer for file uploads (disk storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    } catch (error) {
      console.error('Error creating uploads directory:', error);
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${unique}-${safeName}`;
    console.log('📤 Saving file:', {
      originalName: file.originalname,
      safeName: safeName,
      filename: filename,
      destination: uploadsDir
    });
    cb(null, filename);
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
router.post('/', upload.single('photo'), validateFileUpload(['image/jpeg', 'image/png', 'image/jpg']), validateProperty, createProperty);
router.put('/:id', upload.single('photo'), validateFileUpload(['image/jpeg', 'image/png', 'image/jpg']), validateId, validateProperty, updateProperty);
router.delete('/:id', validateId, deleteProperty);

// Property photos routes
router.post('/:propertyId/photos', uploadPropertyPhotos.array('photos', 10), uploadPhotosController);
router.get('/:propertyId/photos', getPropertyPhotos);
router.delete('/:propertyId/photos/:photoId', deletePropertyPhoto);
router.put('/:propertyId/photos/:photoId/primary', setPrimaryPhoto);

module.exports = router;
