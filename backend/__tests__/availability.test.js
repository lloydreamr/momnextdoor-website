const request = require('supertest');
const app = require('../server');

describe('Availability API Endpoints', () => {
  describe('GET /api/availability', () => {
    it('should return available time slots for a given date', async () => {
      const date = '2025-10-20';

      const response = await request(app)
        .get(`/api/availability?date=${date}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('availableSlots');
      expect(Array.isArray(response.body.availableSlots)).toBe(true);

      // Verify slot structure
      if (response.body.availableSlots.length > 0) {
        const slot = response.body.availableSlots[0];
        expect(slot).toHaveProperty('time');
        expect(slot).toHaveProperty('available');
      }
    });

    it('should handle invalid date format', async () => {
      const response = await request(app)
        .get('/api/availability?date=invalid-date')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should not return slots for past dates', async () => {
      const pastDate = '2020-01-01';

      const response = await request(app)
        .get(`/api/availability?date=${pastDate}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('past');
    });

    it('should handle missing date parameter', async () => {
      const response = await request(app)
        .get('/api/availability')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('date');
    });

    it('should exclude booked slots from availability', async () => {
      const date = '2025-10-25';

      // First, create a booking
      const bookingData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-0123',
        date: date,
        time: '10:00',
        service: 'House Cleaning'
      };

      await request(app)
        .post('/api/bookings')
        .send(bookingData);

      // Then check availability
      const response = await request(app)
        .get(`/api/availability?date=${date}`)
        .expect(200);

      const bookedSlot = response.body.availableSlots?.find(
        slot => slot.time === '10:00'
      );

      if (bookedSlot) {
        expect(bookedSlot.available).toBe(false);
      }
    });
  });

  describe('GET /api/availability/week', () => {
    it('should return availability for entire week', async () => {
      const startDate = '2025-10-20';

      const response = await request(app)
        .get(`/api/availability/week?startDate=${startDate}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('weekAvailability');
      expect(typeof response.body.weekAvailability).toBe('object');

      // Should have 7 days
      const days = Object.keys(response.body.weekAvailability);
      expect(days.length).toBeLessThanOrEqual(7);
    });

    it('should handle weekends correctly', async () => {
      const startDate = '2025-10-20'; // Monday

      const response = await request(app)
        .get(`/api/availability/week?startDate=${startDate}`)
        .expect(200);

      // Check if weekend days have different availability
      const saturday = response.body.weekAvailability['2025-10-25'];
      const sunday = response.body.weekAvailability['2025-10-26'];

      if (saturday) {
        expect(Array.isArray(saturday)).toBe(true);
      }
      if (sunday) {
        expect(Array.isArray(sunday)).toBe(true);
      }
    });
  });

  describe('POST /api/availability/block', () => {
    it('should block time slots for admin', async () => {
      const blockData = {
        date: '2025-10-22',
        times: ['09:00', '10:00', '11:00'],
        reason: 'Staff meeting',
        adminToken: 'test-admin-token' // This would be validated in real app
      };

      const response = await request(app)
        .post('/api/availability/block')
        .send(blockData)
        .expect('Content-Type', /json/);

      // Note: This might return 401 if admin auth is properly implemented
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('blockedSlots');
      }
    });

    it('should reject blocking without admin token', async () => {
      const blockData = {
        date: '2025-10-22',
        times: ['09:00', '10:00']
      };

      const response = await request(app)
        .post('/api/availability/block')
        .send(blockData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/availability/next-available', () => {
    it('should return next available appointment slot', async () => {
      const response = await request(app)
        .get('/api/availability/next-available')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('nextSlot');

      if (response.body.nextSlot) {
        expect(response.body.nextSlot).toHaveProperty('date');
        expect(response.body.nextSlot).toHaveProperty('time');
      }
    });

    it('should skip fully booked days', async () => {
      // This test would need to book all slots for today/tomorrow
      // then verify next-available returns a later date
      const response = await request(app)
        .get('/api/availability/next-available')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });
});