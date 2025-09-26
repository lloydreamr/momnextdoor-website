const request = require('supertest');
const app = require('../server');

describe('Booking API Endpoints', () => {
  describe('POST /api/bookings', () => {
    it('should create a new booking with valid data', async () => {
      const bookingData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-0123',
        date: '2025-10-15',
        time: '10:00',
        service: 'House Cleaning',
        notes: 'Test booking'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('booking');
      expect(response.body.booking.email).toBe(bookingData.email);
    });

    it('should reject booking with missing required fields', async () => {
      const invalidBooking = {
        name: 'Test User',
        // missing email, phone, date, time
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(invalidBooking)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject booking with invalid email format', async () => {
      const bookingData = {
        name: 'Test User',
        email: 'invalid-email',
        phone: '555-0123',
        date: '2025-10-15',
        time: '10:00',
        service: 'House Cleaning'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject booking for past dates', async () => {
      const bookingData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-0123',
        date: '2020-01-01',
        time: '10:00',
        service: 'House Cleaning'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('past');
    });
  });

  describe('GET /api/bookings/:id', () => {
    it('should retrieve booking by ID', async () => {
      // First create a booking
      const bookingData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-0123',
        date: '2025-10-15',
        time: '14:00',
        service: 'Deep Cleaning'
      };

      const createResponse = await request(app)
        .post('/api/bookings')
        .send(bookingData);

      const bookingId = createResponse.body.booking?.id;

      if (bookingId) {
        const response = await request(app)
          .get(`/api/bookings/${bookingId}`)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.booking.id).toBe(bookingId);
      }
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app)
        .get('/api/bookings/999999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/bookings/:id', () => {
    it('should cancel a booking', async () => {
      // First create a booking
      const bookingData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-0123',
        date: '2025-10-16',
        time: '11:00',
        service: 'Regular Cleaning'
      };

      const createResponse = await request(app)
        .post('/api/bookings')
        .send(bookingData);

      const bookingId = createResponse.body.booking?.id;

      if (bookingId) {
        const response = await request(app)
          .delete(`/api/bookings/${bookingId}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');

        // Verify booking is cancelled
        const getResponse = await request(app)
          .get(`/api/bookings/${bookingId}`);

        expect(getResponse.body.booking?.status).toBe('cancelled');
      }
    });
  });
});