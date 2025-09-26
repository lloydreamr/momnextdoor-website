const express = require('express');
const router = express.Router();

// Mock database for testing
let bookings = [];
let bookingIdCounter = 1;

// GET /api/bookings/:id
router.get('/:id', (req, res) => {
  const booking = bookings.find(b => b.id === parseInt(req.params.id));

  if (!booking) {
    return res.status(404).json({
      success: false,
      error: 'Booking not found'
    });
  }

  res.json({
    success: true,
    booking
  });
});

// POST /api/bookings
router.post('/', (req, res) => {
  const { name, email, phone, date, time, service, notes } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !date || !time) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
  }

  // Validate date is not in the past
  const bookingDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (bookingDate < today) {
    return res.status(400).json({
      success: false,
      error: 'Cannot book appointments in the past'
    });
  }

  // Create booking
  const booking = {
    id: bookingIdCounter++,
    name,
    email,
    phone,
    date,
    time,
    service: service || 'House Cleaning',
    notes: notes || '',
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  bookings.push(booking);

  res.status(201).json({
    success: true,
    booking
  });
});

// DELETE /api/bookings/:id
router.delete('/:id', (req, res) => {
  const bookingIndex = bookings.findIndex(b => b.id === parseInt(req.params.id));

  if (bookingIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Booking not found'
    });
  }

  // Mark as cancelled instead of deleting
  bookings[bookingIndex].status = 'cancelled';

  res.json({
    success: true,
    message: 'Booking cancelled successfully'
  });
});

module.exports = router;