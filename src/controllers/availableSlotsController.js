const { getEvents } = require('../config/googleCalendar');

const generateTimeSlots = (date) => {
  const slots = [];
  const [startHour, startMinute] = (process.env.WORKING_HOURS_START || '09:00').split(':').map(Number);
  const [endHour, endMinute] = (process.env.WORKING_HOURS_END || '17:00').split(':').map(Number);
  const appointmentDuration = parseInt(process.env.APPOINTMENT_DURATION || '30');

  const startTime = new Date(date);
  startTime.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date(date);
  endTime.setHours(endHour, endMinute, 0, 0);

  while (startTime < endTime) {
    const slotEnd = new Date(startTime);
    slotEnd.setMinutes(startTime.getMinutes() + appointmentDuration);

    if (slotEnd <= endTime) {
      slots.push({
        start: new Date(startTime),
        end: new Date(slotEnd)
      });
    }

    startTime.setMinutes(startTime.getMinutes() + appointmentDuration);
  }

  return slots;
};

const getAvailableSlots = async (req, res) => {
  try {
    const { date, start, end } = req.query;
    
    if (!date && !start) {
      return res.status(400).json({ error: 'Date or start parameter is required' });
    }

    // If date range is provided, use it; otherwise use single date
    const queryDate = date || start;
    const queryEnd = end || new Date(new Date(queryDate).setDate(new Date(queryDate).getDate() + 1)).toISOString();

    // Get all events for the specified date range
    const events = await getEvents(queryDate, queryEnd);
    
    // Generate all possible time slots
    const allSlots = generateTimeSlots(queryDate);
    
    // Filter out slots that overlap with existing events
    const availableSlots = allSlots.filter(slot => {
      return !events.some(event => {
        const eventStart = new Date(event.start.dateTime || event.start.date);
        const eventEnd = new Date(event.end.dateTime || event.end.date);
        return (
          (slot.start >= eventStart && slot.start < eventEnd) ||
          (slot.end > eventStart && slot.end <= eventEnd) ||
          (slot.start <= eventStart && slot.end >= eventEnd)
        );
      });
    });

    res.json({
      date: queryDate,
      availableSlots: availableSlots.map(slot => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString()
      }))
    });
  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({ error: 'Failed to get available slots' });
  }
};

module.exports = {
  getAvailableSlots
}; 