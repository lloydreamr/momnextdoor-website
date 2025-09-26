/**
 * Form Validation Utility Tests
 * Tests for validation helper functions used across forms
 */

// Import validation functions (these would be from your actual validation module)
const FormValidator = {
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePhone: (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  },

  validateDate: (date) => {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today;
  },

  validateTime: (time, date) => {
    const [hours, minutes] = time.split(':').map(Number);
    if (hours < 8 || hours >= 18) return false; // Business hours 8 AM - 6 PM

    // Don't allow booking less than 2 hours from now
    const bookingDateTime = new Date(date);
    bookingDateTime.setHours(hours, minutes);
    const minBookingTime = new Date();
    minBookingTime.setHours(minBookingTime.getHours() + 2);

    return bookingDateTime > minBookingTime;
  },

  validateName: (name) => {
    return name.trim().length >= 2 && name.trim().length <= 100;
  },

  validateNotes: (notes) => {
    return notes.length <= 500;
  },

  sanitizeInput: (input) => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  validateServiceType: (service) => {
    const validServices = [
      'House Cleaning',
      'Deep Cleaning',
      'Move-in/Move-out Cleaning',
      'Post-Construction Cleaning',
      'Office Cleaning'
    ];
    return validServices.includes(service);
  }
};

describe('Form Validation Utilities', () => {
  describe('Email Validation', () => {
    test('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.com',
        'name+tag@company.org',
        'user123@test-domain.co.uk',
        'firstname.lastname@example.com'
      ];

      validEmails.forEach(email => {
        expect(FormValidator.validateEmail(email)).toBe(true);
      });
    });

    test('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user@.com',
        'user @example.com',
        'user@example',
        'user..test@example.com',
        '',
        null,
        undefined
      ];

      invalidEmails.forEach(email => {
        expect(FormValidator.validateEmail(email)).toBe(false);
      });
    });
  });

  describe('Phone Validation', () => {
    test('should accept valid phone numbers', () => {
      const validPhones = [
        '555-123-4567',
        '(555) 123-4567',
        '5551234567',
        '+1-555-123-4567',
        '555.123.4567',
        '555 123 4567'
      ];

      validPhones.forEach(phone => {
        expect(FormValidator.validatePhone(phone)).toBe(true);
      });
    });

    test('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123',
        '123-456',
        'abc-def-ghij',
        '',
        '123456789', // Too short
        '12345678901234567' // Too long
      ];

      invalidPhones.forEach(phone => {
        expect(FormValidator.validatePhone(phone)).toBe(false);
      });
    });
  });

  describe('Date Validation', () => {
    test('should accept today and future dates', () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      expect(FormValidator.validateDate(today.toISOString().split('T')[0])).toBe(true);
      expect(FormValidator.validateDate(tomorrow.toISOString().split('T')[0])).toBe(true);
      expect(FormValidator.validateDate(nextWeek.toISOString().split('T')[0])).toBe(true);
    });

    test('should reject past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      expect(FormValidator.validateDate(yesterday.toISOString().split('T')[0])).toBe(false);
      expect(FormValidator.validateDate(lastWeek.toISOString().split('T')[0])).toBe(false);
      expect(FormValidator.validateDate('2020-01-01')).toBe(false);
    });

    test('should handle invalid date formats', () => {
      expect(FormValidator.validateDate('not-a-date')).toBe(false);
      expect(FormValidator.validateDate('32/13/2025')).toBe(false);
      expect(FormValidator.validateDate('')).toBe(false);
    });
  });

  describe('Time Validation', () => {
    test('should accept valid business hours', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const validTimes = ['08:00', '09:00', '12:00', '15:00', '17:30'];

      validTimes.forEach(time => {
        expect(FormValidator.validateTime(time, tomorrowStr)).toBe(true);
      });
    });

    test('should reject times outside business hours', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const invalidTimes = ['06:00', '07:30', '18:00', '19:00', '23:00'];

      invalidTimes.forEach(time => {
        expect(FormValidator.validateTime(time, tomorrowStr)).toBe(false);
      });
    });

    test('should reject times less than 2 hours from now', () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const currentHour = today.getHours();

      // Time 1 hour from now (should be rejected)
      const oneHourLater = `${String(currentHour + 1).padStart(2, '0')}:00`;

      // Only test if within business hours
      if (currentHour + 1 < 18) {
        expect(FormValidator.validateTime(oneHourLater, todayStr)).toBe(false);
      }
    });
  });

  describe('Name Validation', () => {
    test('should accept valid names', () => {
      const validNames = [
        'John Doe',
        'Mary Jane Smith',
        'Li Wei',
        'María García',
        'Jean-Pierre',
        'O\'Brien'
      ];

      validNames.forEach(name => {
        expect(FormValidator.validateName(name)).toBe(true);
      });
    });

    test('should reject invalid names', () => {
      const invalidNames = [
        'A', // Too short
        '', // Empty
        '   ', // Only spaces
        'A'.repeat(101) // Too long
      ];

      invalidNames.forEach(name => {
        expect(FormValidator.validateName(name)).toBe(false);
      });
    });
  });

  describe('Notes Validation', () => {
    test('should accept notes within character limit', () => {
      expect(FormValidator.validateNotes('')).toBe(true);
      expect(FormValidator.validateNotes('Short note')).toBe(true);
      expect(FormValidator.validateNotes('A'.repeat(500))).toBe(true);
    });

    test('should reject notes exceeding character limit', () => {
      expect(FormValidator.validateNotes('A'.repeat(501))).toBe(false);
      expect(FormValidator.validateNotes('A'.repeat(1000))).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize HTML special characters', () => {
      expect(FormValidator.sanitizeInput('<script>alert("XSS")</script>'))
        .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');

      expect(FormValidator.sanitizeInput('Hello <b>World</b>'))
        .toBe('Hello &lt;b&gt;World&lt;&#x2F;b&gt;');

      expect(FormValidator.sanitizeInput('"Quoted" & \'Text\''))
        .toBe('&quot;Quoted&quot; & &#x27;Text&#x27;');
    });

    test('should preserve normal text', () => {
      expect(FormValidator.sanitizeInput('Normal text with spaces'))
        .toBe('Normal text with spaces');

      expect(FormValidator.sanitizeInput('Text with numbers 123 and symbols !@#'))
        .toBe('Text with numbers 123 and symbols !@#');
    });
  });

  describe('Service Type Validation', () => {
    test('should accept valid service types', () => {
      const validServices = [
        'House Cleaning',
        'Deep Cleaning',
        'Move-in/Move-out Cleaning',
        'Post-Construction Cleaning',
        'Office Cleaning'
      ];

      validServices.forEach(service => {
        expect(FormValidator.validateServiceType(service)).toBe(true);
      });
    });

    test('should reject invalid service types', () => {
      const invalidServices = [
        'Invalid Service',
        'house cleaning', // Case sensitive
        '',
        null,
        undefined,
        'Cleaning'
      ];

      invalidServices.forEach(service => {
        expect(FormValidator.validateServiceType(service)).toBe(false);
      });
    });
  });

  describe('Complete Form Validation', () => {
    test('should validate complete form data', () => {
      const validFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-123-4567',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        time: '10:00',
        service: 'House Cleaning',
        notes: 'Please bring supplies'
      };

      // Validate each field
      expect(FormValidator.validateName(validFormData.name)).toBe(true);
      expect(FormValidator.validateEmail(validFormData.email)).toBe(true);
      expect(FormValidator.validatePhone(validFormData.phone)).toBe(true);
      expect(FormValidator.validateDate(validFormData.date)).toBe(true);
      expect(FormValidator.validateTime(validFormData.time, validFormData.date)).toBe(true);
      expect(FormValidator.validateServiceType(validFormData.service)).toBe(true);
      expect(FormValidator.validateNotes(validFormData.notes)).toBe(true);
    });

    test('should detect invalid form data', () => {
      const invalidFormData = {
        name: 'A', // Too short
        email: 'not-an-email',
        phone: '123',
        date: '2020-01-01', // Past date
        time: '23:00', // Outside business hours
        service: 'Invalid Service',
        notes: 'A'.repeat(501) // Too long
      };

      // Check that validation fails
      expect(FormValidator.validateName(invalidFormData.name)).toBe(false);
      expect(FormValidator.validateEmail(invalidFormData.email)).toBe(false);
      expect(FormValidator.validatePhone(invalidFormData.phone)).toBe(false);
      expect(FormValidator.validateDate(invalidFormData.date)).toBe(false);
      expect(FormValidator.validateTime(invalidFormData.time, invalidFormData.date)).toBe(false);
      expect(FormValidator.validateServiceType(invalidFormData.service)).toBe(false);
      expect(FormValidator.validateNotes(invalidFormData.notes)).toBe(false);
    });
  });
});

// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormValidator;
}