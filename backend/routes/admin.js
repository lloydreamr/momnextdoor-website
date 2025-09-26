const express = require('express');
const router = express.Router();

// Simple admin auth middleware
const requireAdmin = (req, res, next) => {
  const { adminToken } = req.headers;

  if (!adminToken || adminToken !== 'test-admin-token') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  next();
};

// GET /api/admin/bookings
router.get('/bookings', requireAdmin, (req, res) => {
  // Return mock bookings for testing
  res.json({
    success: true,
    bookings: [],
    total: 0
  });
});

// GET /api/admin/stats
router.get('/stats', requireAdmin, (req, res) => {
  res.json({
    success: true,
    stats: {
      totalBookings: 0,
      todayBookings: 0,
      weekBookings: 0,
      monthBookings: 0
    }
  });
});

module.exports = router;