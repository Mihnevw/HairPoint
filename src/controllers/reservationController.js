const { body, validationResult } = require('express-validator');
const { sendClientConfirmation, sendAdminNotification } = require('../services/emailService');

// In-memory storage for reservations (temporary solution)
let reservations = [];

const validateReservation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('date').trim().notEmpty().withMessage('Date is required'),
  body('startTime').trim().notEmpty().withMessage('Start time is required'),
  body('endTime').trim().notEmpty().withMessage('End time is required')
];

// Helper function to check for time slot conflicts
const hasTimeConflict = (newDate, newStart, newEnd, existingReservations) => {
  return existingReservations.some(reservation => {
    // Only check conflicts for the same date
    if (reservation.date !== newDate) {
      return false;
    }

    const [newStartHour, newStartMin] = newStart.split(':').map(Number);
    const [newEndHour, newEndMin] = newEnd.split(':').map(Number);
    const [existingStartHour, existingStartMin] = reservation.startTime.split(':').map(Number);
    const [existingEndHour, existingEndMin] = reservation.endTime.split(':').map(Number);

    const newStartMins = newStartHour * 60 + newStartMin;
    const newEndMins = newEndHour * 60 + newEndMin;
    const existingStartMins = existingStartHour * 60 + existingStartMin;
    const existingEndMins = existingEndHour * 60 + existingEndMin;

    return (
      (newStartMins >= existingStartMins && newStartMins < existingEndMins) ||
      (newEndMins > existingStartMins && newEndMins <= existingEndMins) ||
      (newStartMins <= existingStartMins && newEndMins >= existingEndMins)
    );
  });
};

const createReservation = async (req, res) => {
  try {
    const { date, startTime, endTime, name, phone, email } = req.body;

    // Validate required fields
    if (!date || !startTime || !endTime || !name || !phone || !email) {
      return res.status(400).json({ 
        error: 'Всички полета са задължителни' 
      });
    }

    // Check for time slot conflicts
    if (hasTimeConflict(date, startTime, endTime, reservations)) {
      return res.status(409).json({ 
        error: 'Избраният час вече е зает. Моля, изберете друг час/дата!' 
      });
    }

    // Create new reservation
    const reservation = {
      id: Date.now().toString(),
      date,
      startTime,
      endTime,
      name,
      phone,
      email,
      createdAt: new Date()
    };

    // Add to in-memory storage
    reservations.push(reservation);

    // Send confirmation emails
    try {
      await sendClientConfirmation(reservation);
      await sendAdminNotification(reservation);
    } catch (emailError) {
      console.error('Error sending confirmation emails:', emailError);
      // Don't throw here, as the reservation was already created
    }

    res.status(201).json(reservation);
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ 
      error: 'Възникна грешка при създаването на резервацията' 
    });
  }
};

const getAllReservations = async (req, res) => {
  try {
    res.json(reservations);
  } catch (error) {
    console.error('Error getting reservations:', error);
    res.status(500).json({ 
      error: 'Възникна грешка при извличането на резервациите' 
    });
  }
};

module.exports = {
  createReservation,
  validateReservation,
  getAllReservations
}; 