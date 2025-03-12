const express = require('express');
const router = express.Router();
const { createReservation, validateReservation, getAllReservations } = require('../controllers/reservationController');

// Create reservation
router.post('/', validateReservation, createReservation);

// Debug endpoint - get all reservations
router.get('/', getAllReservations);

module.exports = router; 