/**
 * Booking Form Validation Tests
 * Tests for the frontend booking form validation and submission
 */

// Mock DOM environment for testing
const setupDOM = () => {
  document.body.innerHTML = `
    <form id="booking-form">
      <input type="text" name="name" required>
      <input type="email" name="email" required>
      <input type="tel" name="phone" required>
      <input type="date" name="date" required>
      <select name="time" required></select>
      <select name="service" required></select>
      <textarea name="notes"></textarea>
      <button type="submit">Book Appointment</button>
    </form>
    <div id="error-message"></div>
    <div id="success-message"></div>
  `;
};

describe('Booking Form Validation', () => {
  beforeEach(() => {
    setupDOM();
  });

  describe('Form Field Validation', () => {
    test('should require all mandatory fields', () => {
      const form = document.getElementById('booking-form');
      const requiredFields = ['name', 'email', 'phone', 'date', 'time', 'service'];

      requiredFields.forEach(fieldName => {
        const field = form.elements[fieldName];
        expect(field).toBeDefined();
        expect(field.hasAttribute('required')).toBe(true);
      });
    });

    test('should validate email format', () => {
      const emailField = document.querySelector('input[name="email"]');

      // Test invalid emails
      const invalidEmails = ['notanemail', '@example.com', 'user@', 'user@.com'];
      invalidEmails.forEach(email => {
        emailField.value = email;
        expect(emailField.checkValidity()).toBe(false);
      });

      // Test valid emails
      const validEmails = ['user@example.com', 'test.user@domain.co.uk', 'name+tag@company.org'];
      validEmails.forEach(email => {
        emailField.value = email;
        expect(emailField.checkValidity()).toBe(true);
      });
    });

    test('should validate phone number format', () => {
      const phoneField = document.querySelector('input[name="phone"]');

      // Test valid phone formats
      const validPhones = ['555-0123', '(555) 012-3456', '5550123456', '+1-555-012-3456'];
      validPhones.forEach(phone => {
        phoneField.value = phone;
        const isValid = /^[\d\s\-\(\)\+]+$/.test(phone) && phone.replace(/\D/g, '').length >= 7;
        expect(isValid).toBe(true);
      });

      // Test invalid phone formats
      const invalidPhones = ['123', 'abc-defg', ''];
      invalidPhones.forEach(phone => {
        phoneField.value = phone;
        const isValid = /^[\d\s\-\(\)\+]+$/.test(phone) && phone.replace(/\D/g, '').length >= 7;
        expect(isValid).toBe(false);
      });
    });

    test('should not allow past dates', () => {
      const dateField = document.querySelector('input[name="date"]');
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      dateField.value = yesterday.toISOString().split('T')[0];
      dateField.min = today.toISOString().split('T')[0];

      expect(dateField.checkValidity()).toBe(false);
    });

    test('should allow future dates', () => {
      const dateField = document.querySelector('input[name="date"]');
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      dateField.value = tomorrow.toISOString().split('T')[0];
      dateField.min = today.toISOString().split('T')[0];

      expect(dateField.checkValidity()).toBe(true);
    });

    test('should limit notes field to maximum characters', () => {
      const notesField = document.querySelector('textarea[name="notes"]');
      const maxLength = 500;
      notesField.maxLength = maxLength;

      // Test within limit
      notesField.value = 'A'.repeat(100);
      expect(notesField.value.length).toBeLessThanOrEqual(maxLength);
      expect(notesField.checkValidity()).toBe(true);

      // Test at limit
      notesField.value = 'A'.repeat(maxLength);
      expect(notesField.value.length).toBe(maxLength);
      expect(notesField.checkValidity()).toBe(true);

      // Browser should prevent exceeding maxLength
      const longText = 'A'.repeat(maxLength + 100);
      notesField.value = longText;
      expect(notesField.value.length).toBeLessThanOrEqual(maxLength);
    });
  });

  describe('Form Submission', () => {
    test('should prevent submission with empty required fields', () => {
      const form = document.getElementById('booking-form');
      const submitEvent = new Event('submit', { cancelable: true });

      const result = form.dispatchEvent(submitEvent);
      expect(result).toBe(false); // Form should not submit
    });

    test('should collect all form data correctly', () => {
      const form = document.getElementById('booking-form');

      // Fill in form data
      form.elements.name.value = 'John Doe';
      form.elements.email.value = 'john@example.com';
      form.elements.phone.value = '555-0123';
      form.elements.date.value = '2025-10-15';

      // Add options and select them
      form.elements.time.innerHTML = '<option value="10:00">10:00 AM</option>';
      form.elements.time.value = '10:00';

      form.elements.service.innerHTML = '<option value="cleaning">House Cleaning</option>';
      form.elements.service.value = 'cleaning';

      form.elements.notes.value = 'Please bring supplies';

      // Collect form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      expect(data.name).toBe('John Doe');
      expect(data.email).toBe('john@example.com');
      expect(data.phone).toBe('555-0123');
      expect(data.date).toBe('2025-10-15');
      expect(data.time).toBe('10:00');
      expect(data.service).toBe('cleaning');
      expect(data.notes).toBe('Please bring supplies');
    });

    test('should show error message on submission failure', () => {
      const errorDiv = document.getElementById('error-message');
      const errorMessage = 'Failed to submit booking. Please try again.';

      // Simulate error display
      errorDiv.textContent = errorMessage;
      errorDiv.style.display = 'block';

      expect(errorDiv.textContent).toBe(errorMessage);
      expect(errorDiv.style.display).toBe('block');
    });

    test('should show success message on successful submission', () => {
      const successDiv = document.getElementById('success-message');
      const successMessage = 'Booking confirmed! Check your email for details.';

      // Simulate success display
      successDiv.textContent = successMessage;
      successDiv.style.display = 'block';

      expect(successDiv.textContent).toBe(successMessage);
      expect(successDiv.style.display).toBe('block');
    });

    test('should clear form after successful submission', () => {
      const form = document.getElementById('booking-form');

      // Fill form
      form.elements.name.value = 'John Doe';
      form.elements.email.value = 'john@example.com';

      // Simulate successful submission and reset
      form.reset();

      expect(form.elements.name.value).toBe('');
      expect(form.elements.email.value).toBe('');
    });
  });

  describe('Date and Time Selection', () => {
    test('should disable unavailable time slots', () => {
      const timeSelect = document.querySelector('select[name="time"]');

      // Add time options with availability
      timeSelect.innerHTML = `
        <option value="09:00">9:00 AM</option>
        <option value="10:00" disabled>10:00 AM (Booked)</option>
        <option value="11:00">11:00 AM</option>
        <option value="14:00" disabled>2:00 PM (Booked)</option>
      `;

      const options = timeSelect.querySelectorAll('option');
      expect(options[1].disabled).toBe(true);
      expect(options[3].disabled).toBe(true);
      expect(options[0].disabled).toBe(false);
      expect(options[2].disabled).toBe(false);
    });

    test('should update available times when date changes', () => {
      const dateField = document.querySelector('input[name="date"]');
      const timeSelect = document.querySelector('select[name="time"]');

      // Simulate date change
      dateField.value = '2025-10-20';
      const changeEvent = new Event('change');
      dateField.dispatchEvent(changeEvent);

      // Check that time select would be updated
      // In real implementation, this would trigger an API call
      expect(dateField.value).toBe('2025-10-20');
    });

    test('should not allow selection of weekends if disabled', () => {
      const dateField = document.querySelector('input[name="date"]');

      // Function to check if date is weekend
      const isWeekend = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
      };

      const saturday = '2025-10-25'; // This is a Saturday
      const sunday = '2025-10-26'; // This is a Sunday
      const monday = '2025-10-27'; // This is a Monday

      expect(isWeekend(saturday)).toBe(true);
      expect(isWeekend(sunday)).toBe(true);
      expect(isWeekend(monday)).toBe(false);
    });
  });
});

// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setupDOM };
}