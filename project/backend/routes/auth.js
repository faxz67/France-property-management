const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  logout
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validateLogin, validateAdmin } = require('../middleware/validation');

// Public routes
router.post('/register', validateAdmin, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.post('/logout', verifyToken, logout);

module.exports = router;
