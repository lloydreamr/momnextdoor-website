/**
 * Booking System Main Initialization
 * Initializes all booking components when page loads
 */

(function() {
    'use strict';

    // Initialize booking system when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Initializing booking system...');

        try {
            // Initialize components in order
            window.bookingAPI = new BookingAPI();
            window.bookingCalendar = new BookingCalendar();
            window.bookingFlow = new BookingFlow();
            window.bookingAssistant = new BookingAssistant();

            console.log('Booking system initialized successfully');

            // Check for URL parameters (for direct linking)
            handleURLParameters();

            // Set up page visibility handler
            setupVisibilityHandler();

            // Load user preferences if returning visitor
            loadUserPreferences();

        } catch (error) {
            console.error('Error initializing booking system:', error);
            showInitializationError();
        }
    });

    /**
     * Handle URL parameters for direct booking links
     * Example: booking.html?type=consultation&date=2025-01-15
     */
    function handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);

        // Check for meeting type parameter
        const meetingType = urlParams.get('type');
        if (meetingType && ['consultation', 'follow-up', 'detailed'].includes(meetingType)) {
            // Pre-select meeting type
            setTimeout(() => {
                if (window.bookingFlow) {
                    window.bookingFlow.selectMeetingType(meetingType);
                }
            }, 500);
        }

        // Check for date parameter
        const dateParam = urlParams.get('date');
        if (dateParam) {
            try {
                const date = new Date(dateParam);
                if (!isNaN(date.getTime()) && date > new Date()) {
                    setTimeout(() => {
                        if (window.bookingCalendar) {
                            window.bookingCalendar.selectDate(date);
                        }
                    }, 1000);
                }
            } catch (error) {
                console.error('Invalid date parameter:', dateParam);
            }
        }

        // Check for referral source
        const source = urlParams.get('source');
        if (source) {
            // Track referral source for analytics
            sessionStorage.setItem('bookingSource', source);
            if (typeof gtag !== 'undefined') {
                gtag('event', 'booking_referral', {
                    source: source
                });
            }
        }
    }

    /**
     * Setup visibility handler to refresh slots when page becomes visible
     */
    function setupVisibilityHandler() {
        let lastVisibilityChange = Date.now();

        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                const timeSinceLastVisible = Date.now() - lastVisibilityChange;

                // If page was hidden for more than 5 minutes, refresh available slots
                if (timeSinceLastVisible > 300000) {
                    if (window.bookingCalendar && window.bookingCalendar.selectedDate) {
                        console.log('Refreshing available slots after extended inactivity...');
                        window.bookingCalendar.loadAvailableSlots();
                    }
                }
            }
            lastVisibilityChange = Date.now();
        });
    }

    /**
     * Load user preferences from localStorage
     */
    function loadUserPreferences() {
        try {
            const savedPreferences = localStorage.getItem('bookingPreferences');
            if (savedPreferences) {
                const prefs = JSON.parse(savedPreferences);

                // Pre-fill form if user has booked before
                if (prefs.userName) {
                    const nameField = document.getElementById('userName');
                    if (nameField) nameField.value = prefs.userName;
                }
                if (prefs.userEmail) {
                    const emailField = document.getElementById('userEmail');
                    if (emailField) emailField.value = prefs.userEmail;
                }
                if (prefs.userPhone) {
                    const phoneField = document.getElementById('userPhone');
                    if (phoneField) phoneField.value = prefs.userPhone;
                }

                // Set reminder preferences
                if (typeof prefs.sendReminders === 'boolean') {
                    const remindersCheckbox = document.getElementById('sendReminders');
                    if (remindersCheckbox) remindersCheckbox.checked = prefs.sendReminders;
                }
                if (typeof prefs.addToCalendar === 'boolean') {
                    const calendarCheckbox = document.getElementById('addToCalendar');
                    if (calendarCheckbox) calendarCheckbox.checked = prefs.addToCalendar;
                }
            }

            // Check for recent booking
            const lastBooking = localStorage.getItem('lastBooking');
            if (lastBooking) {
                const booking = JSON.parse(lastBooking);
                const bookingDate = new Date(booking.date);

                // If booking is in the future, show a notice
                if (bookingDate > new Date()) {
                    showExistingBookingNotice(booking);
                }
            }

        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
    }

    /**
     * Save user preferences when booking is confirmed
     */
    window.saveUserPreferences = function(bookingData) {
        try {
            const preferences = {
                userName: bookingData.userName,
                userEmail: bookingData.userEmail,
                userPhone: bookingData.userPhone,
                sendReminders: bookingData.sendReminders,
                addToCalendar: bookingData.addToCalendar,
                lastBookingDate: new Date().toISOString()
            };

            localStorage.setItem('bookingPreferences', JSON.stringify(preferences));
        } catch (error) {
            console.error('Error saving user preferences:', error);
        }
    };

    /**
     * Show notice about existing booking
     */
    function showExistingBookingNotice(booking) {
        const notice = document.createElement('div');
        notice.className = 'existing-booking-notice';
        notice.innerHTML = `
            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #27AE60;">
                <p style="margin: 0; color: #27AE60; font-weight: 600;">
                    You have an upcoming appointment
                </p>
                <p style="margin: 5px 0 0 0; color: #333;">
                    Confirmation: ${booking.confirmationNumber}<br>
                    Date: ${new Date(booking.date).toLocaleDateString()}<br>
                    Time: ${new Date(booking.time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    })}
                </p>
                <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 10px; padding: 5px 15px; background: white; border: 1px solid #27AE60; color: #27AE60; border-radius: 4px; cursor: pointer;">
                    Book Another
                </button>
            </div>
        `;

        const container = document.querySelector('.booking-flow');
        if (container) {
            container.insertBefore(notice, container.firstChild);
        }
    }

    /**
     * Show initialization error
     */
    function showInitializationError() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'initialization-error';
        errorDiv.innerHTML = `
            <div style="background: #fee; padding: 20px; border-radius: 8px; text-align: center; max-width: 600px; margin: 50px auto;">
                <h2 style="color: #c00; margin: 0 0 10px 0;">Booking System Unavailable</h2>
                <p style="color: #333; margin: 10px 0;">
                    We're experiencing technical difficulties with our online booking system.
                </p>
                <p style="color: #333; margin: 10px 0;">
                    Please call us directly to schedule your appointment:
                </p>
                <a href="tel:7809041463" style="display: inline-block; margin-top: 15px; padding: 12px 30px; background: #4A90E2; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
                    780-904-1463
                </a>
            </div>
        `;

        document.body.innerHTML = '';
        document.body.appendChild(errorDiv);
    }

    /**
     * Analytics tracking helper
     */
    window.trackBookingEvent = function(eventName, parameters) {
        // Google Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                ...parameters,
                booking_source: sessionStorage.getItem('bookingSource') || 'direct'
            });
        }

        // Custom tracking can be added here
        console.log('Booking event:', eventName, parameters);
    };

    /**
     * Format phone numbers for display
     */
    window.formatPhoneNumber = function(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        return phone;
    };

    /**
     * Validate Canadian postal code
     */
    window.validatePostalCode = function(postalCode) {
        const regex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
        return regex.test(postalCode);
    };

    /**
     * Get user's timezone
     */
    window.getUserTimezone = function() {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const timezoneDisplay = document.getElementById('userTimezone');
        if (timezoneDisplay) {
            // Display friendly timezone name
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                timeZoneName: 'short',
                timeZone: timezone
            });
            const tzAbbr = timeString.split(' ').pop();
            timezoneDisplay.textContent = `${timezone.split('/').pop().replace(/_/g, ' ')} (${tzAbbr})`;
        }
        return timezone;
    };

    // Set timezone on load
    window.getUserTimezone();

})();

// Polyfill for older browsers
if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

console.log('Booking system script loaded');