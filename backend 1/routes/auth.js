const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  uploadSignature
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validateLogin, validateAdmin } = require('../middleware/validation');
const { uploadAdminSignature } = require('../utils/fileUpload');

// Public routes
router.post('/register', validateAdmin, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.post('/change-password', verifyToken, changePassword);
router.post('/logout', verifyToken, logout);
// Upload signature route - verifyToken must come before multer middleware
router.post(
  '/profile/signature',
  verifyToken, // Must be first to ensure req.admin is available for multer
  (req, res, next) => {
    // Error handler for multer errors
    uploadAdminSignature.single('signature')(req, res, (err) => {
      if (err) {
        console.error('Multer upload error:', err);
        return res.status(400).json({
          success: false,
          error: err.message || 'File upload failed'
        });
      }
      next();
    });
  },
  uploadSignature
);

module.exports = router;
