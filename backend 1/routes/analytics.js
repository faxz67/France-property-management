const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const controller = require('../controllers/analyticsController');

router.get('/overview', verifyToken, controller.overview);

module.exports = router;


