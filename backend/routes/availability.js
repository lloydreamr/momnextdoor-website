const express = require('express');
const router = express.Router();

// Mock booked slots for testing
let bookedSlots = {};

// Helper function to generate time slots
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour < 18; hour++) {
    slots.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      available: true
    });
  }
  return slots;
};

// GET /api/availability
router.get('/', (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      error: 'Date parameter is required'
    });
  }

  // Validate date format
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid date format'
    });
  }

  // Check if date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dateObj < today) {
    return res.status(400).json({
      success: false,
      error: 'Cannot check availability for past dates'
    });
  }

  // Generate available slots
  let availableSlots = generateTimeSlots();

  // Mark booked slots as unavailable
  if (bookedSlots[date]) {
    availableSlots = availableSlots.map(slot => ({
      ...slot,
      available: !bookedSlots[date].includes(slot.time)
    }));
  }

  res.json({
    success: true,
    date,
    availableSlots
  });
});

// GET /api/availability/week
router.get('/week', (req, res) => {
  const { startDate } = req.query;

  if (!startDate) {
    return res.status(400).json({
      success: false,
      error: 'Start date parameter is required'
    });
  }

  const start = new Date(startDate);
  const weekAvailability = {};

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    let slots = generateTimeSlots();

    // Mark booked slots
    if (bookedSlots[dateStr]) {
      slots = slots.map(slot => ({
        ...slot,
        available: !bookedSlots[dateStr].includes(slot.time)
      }));
    }

    weekAvailability[dateStr] = slots;
  }

  res.json({
    success: true,
    weekAvailability
  });
});

// GET /api/availability/next-available
router.get('/next-available', (req, res) => {
  const today = new Date();
  let checkDate = new Date(today);
  checkDate.setHours(checkDate.getHours() + 2); // Min 2 hours from now

  // Look for next available slot (max 30 days)
  for (let days = 0; days < 30; days++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const slots = generateTimeSlots();

    // Find available slot
    for (const slot of slots) {
      const [hour, minute] = slot.time.split(':').map(Number);
      const slotTime = new Date(checkDate);
      slotTime.setHours(hour, minute, 0, 0);

      // Check if slot is in future and not booked
      if (slotTime > new Date() &&
          (!bookedSlots[dateStr] || !bookedSlots[dateStr].includes(slot.time))) {
        return res.json({
          success: true,
          nextSlot: {
            date: dateStr,
            time: slot.time
          }
        });
      }
    }

    checkDate.setDate(checkDate.getDate() + 1);
  }

  res.json({
    success: true,
    nextSlot: null,
    message: 'No available slots in the next 30 days'
  });
});

// POST /api/availability/block (admin only)
router.post('/block', (req, res) => {
  const { date, times, adminToken } = req.body;

  // Simple admin auth check
  if (!adminToken) {
    return res.status(401).json({
      success: false,
      error: 'Admin authorization required'
    });
  }

  if (!date || !times || !Array.isArray(times)) {
    return res.status(400).json({
      success: false,
      error: 'Date and times array are required'
    });
  }

  // Initialize date if not exists
  if (!bookedSlots[date]) {
    bookedSlots[date] = [];
  }

  // Add times to booked slots
  times.forEach(time => {
    if (!bookedSlots[date].includes(time)) {
      bookedSlots[date].push(time);
    }
  });

  res.json({
    success: true,
    blockedSlots: times,
    date
  });
});

// Helper function to mark slot as booked (used by appointments route)
router.markSlotBooked = (date, time) => {
  if (!bookedSlots[date]) {
    bookedSlots[date] = [];
  }
  if (!bookedSlots[date].includes(time)) {
    bookedSlots[date].push(time);
  }
};

module.exports = router;