const express = require('express');
const router = express.Router();
const { getAvailableSlots } = require('../controllers/availableSlotsController');
const { checkAuth } = require('../middleware/authMiddleware');

router.get('/', checkAuth, getAvailableSlots);

module.exports = router; 