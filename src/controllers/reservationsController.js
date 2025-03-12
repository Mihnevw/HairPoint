const Reservation = require('../models/Reservation');
const { sendClientConfirmation, sendSalonNotification } = require('../utils/emailService');

// Check if a time slot is available
const isTimeSlotAvailable = async (startTime, endTime) => {
    const existingReservation = await Reservation.findOne({
        $or: [
            // Check for overlapping appointments
            {
                startTime: { $lt: endTime },
                endTime: { $gt: startTime }
            }
        ]
    });
    return !existingReservation;
};

// Create a new reservation
exports.createReservation = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, message, startTime, endTime } = req.body;

        // Validate time slot availability
        const isAvailable = await isTimeSlotAvailable(startTime, endTime);
        if (!isAvailable) {
            return res.status(400).json({ error: 'This time slot is no longer available. Please select another time.' });
        }

        // Create the reservation
        const reservation = new Reservation({
            firstName,
            lastName,
            email,
            phone,
            message,
            startTime,
            endTime
        });

        await reservation.save();

        // Send confirmation emails
        await Promise.all([
            sendClientConfirmation(reservation),
            sendSalonNotification(reservation)
        ]);

        res.status(201).json({
            message: 'Reservation created successfully',
            reservation
        });
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({ error: 'Failed to create reservation' });
    }
};

// Get available time slots for a specific date
exports.getAvailableSlots = async (req, res) => {
    try {
        const { date } = req.query;
        const startOfDay = new Date(date);
        startOfDay.setHours(9, 0, 0, 0); // Start at 9 AM
        const endOfDay = new Date(date);
        endOfDay.setHours(17, 0, 0, 0); // End at 5 PM

        // Get all reservations for the day
        const reservations = await Reservation.find({
            startTime: { $gte: startOfDay, $lte: endOfDay }
        });

        // Generate all possible time slots
        const availableSlots = [];
        let currentTime = new Date(startOfDay);

        while (currentTime < endOfDay) {
            const slotEnd = new Date(currentTime);
            slotEnd.setMinutes(slotEnd.getMinutes() + 30);

            // Check if this slot overlaps with any existing reservation
            const isSlotTaken = reservations.some(reservation => {
                return (
                    (currentTime >= reservation.startTime && currentTime < reservation.endTime) ||
                    (slotEnd > reservation.startTime && slotEnd <= reservation.endTime)
                );
            });

            if (!isSlotTaken) {
                availableSlots.push({
                    start: new Date(currentTime),
                    end: slotEnd
                });
            }

            currentTime = slotEnd;
        }

        res.json({ availableSlots });
    } catch (error) {
        console.error('Error fetching available slots:', error);
        res.status(500).json({ error: 'Failed to fetch available slots' });
    }
};

// Get all reservations
exports.getAllReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find().sort({ startTime: 1 });
        res.json(reservations);
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({ error: 'Failed to fetch reservations' });
    }
};

// Update a reservation
exports.updateReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { startTime, endTime } = req.body;

        // Check if the new time slot is available
        const isAvailable = await isTimeSlotAvailable(startTime, endTime);
        if (!isAvailable) {
            return res.status(400).json({ error: 'This time slot is no longer available. Please select another time.' });
        }

        const reservation = await Reservation.findByIdAndUpdate(
            id,
            { ...req.body },
            { new: true }
        );

        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        res.json(reservation);
    } catch (error) {
        console.error('Error updating reservation:', error);
        res.status(500).json({ error: 'Failed to update reservation' });
    }
};

// Delete a reservation
exports.deleteReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const reservation = await Reservation.findByIdAndDelete(id);

        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        res.json({ message: 'Reservation deleted successfully' });
    } catch (error) {
        console.error('Error deleting reservation:', error);
        res.status(500).json({ error: 'Failed to delete reservation' });
    }
}; 