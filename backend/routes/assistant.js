const express = require('express');
const router = express.Router();

// Mock assistant responses
router.post('/chat', (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }

  // Simple mock responses
  let response = 'I can help you book an appointment. What service are you looking for?';

  if (message.toLowerCase().includes('price') || message.toLowerCase().includes('cost')) {
    response = 'Our pricing varies by service. House cleaning starts at $80, deep cleaning at $150.';
  } else if (message.toLowerCase().includes('available') || message.toLowerCase().includes('schedule')) {
    response = 'We have availability throughout the week. Would you like to check a specific date?';
  } else if (message.toLowerCase().includes('service')) {
    response = 'We offer house cleaning, deep cleaning, move-in/out cleaning, and office cleaning.';
  }

  res.json({
    success: true,
    response,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;