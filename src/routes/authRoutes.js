const express = require('express');
const router = express.Router();
const { initiateAuth, handleCallback, refreshToken } = require('../controllers/authController');

// Google OAuth routes
router.get('/google', initiateAuth);
router.get('/google/callback', handleCallback);
router.post('/refresh-token', refreshToken);

module.exports = router; 