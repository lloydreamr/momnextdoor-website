/**
 * Booking Flow Controller
 * Manages the multi-step booking process
 */

class BookingFlow {
    constructor() {
        this.api = null; // Will be set after BookingAPI is initialized
        this.currentStep = 1;
        this.bookingData = {
            meetingType: null,
            duration: 30,
            date: null,
            timeSlot: null,
            userName: '',
            userEmail: '',
            userPhone: '',
            childAge: '',
            meetingPurpose: '',
            specialNeeds: '',
            sendReminders: true,
            addToCalendar: true
        };

        this.meetingTypes = {
            'consultation': {
                name: 'Initial Consultation',
                duration: 30,
                description: 'Get to know our services and discuss your family\'s needs'
            },
            'follow-up': {
                name: 'Follow-up Meeting',
                duration: 15,
                description: 'Quick check-in or questions about ongoing care'
            },
            'detailed': {
                name: 'Detailed Planning',
                duration: 60,
                description: 'Comprehensive care planning and strategy session'
            }
        };

        this.init();
    }

    init() {
        // Set up meeting type selection
        document.querySelectorAll('.meeting-type-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const type = card.dataset.type;
                this.selectMeetingType(type);
            });
        });

        // Set up form validation
        this.setupFormValidation();

        // Set up navigation buttons
        document.getElementById('continueToDetails')?.addEventListener('click', () => {
            if (this.validateTimeSelection()) {
                this.goToStep(3);
            }
        });

        document.getElementById('continueToConfirm')?.addEventListener('click', () => {
            if (this.validateContactDetails()) {
                this.prepareConfirmation();
                this.goToStep(4);
            }
        });

        document.getElementById('confirmBooking')?.addEventListener('click', () => {
            this.confirmBooking();
        });

        // Set up back buttons
        document.querySelectorAll('.btn-back').forEach(btn => {
            btn.addEventListener('click', () => this.previousStep());
        });
    }

    selectMeetingType(type) {
        // Update UI
        document.querySelectorAll('.meeting-type-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-type="${type}"]`)?.classList.add('selected');

        // Store selection
        this.bookingData.meetingType = type;
        this.bookingData.duration = this.meetingTypes[type].duration;
        this.selectedMeetingDuration = this.meetingTypes[type].duration;

        // Update assistant context
        if (window.bookingAssistant) {
            window.bookingAssistant.updateContext({
                meetingType: type,
                duration: this.meetingTypes[type].duration,
                step: 'meeting_selected'
            });
        }

        // Auto-advance after short delay
        setTimeout(() => {
            this.goToStep(2);
        }, 300);
    }

    goToStep(step) {
        // Update progress indicator
        document.querySelectorAll('.progress-step').forEach((el, index) => {
            if (index < step - 1) {
                el.classList.add('completed');
                el.classList.remove('active');
            } else if (index === step - 1) {
                el.classList.add('active');
                el.classList.remove('completed');
            } else {
                el.classList.remove('active', 'completed');
            }
        });

        // Show appropriate step content
        document.querySelectorAll('.booking-step').forEach(el => {
            el.classList.remove('active');
        });
        document.getElementById(`step${step}`)?.classList.add('active');

        this.currentStep = step;

        // Update assistant
        if (window.bookingAssistant) {
            window.bookingAssistant.updateContext({
                step: `step_${step}`
            });
        }

        // Special handling for step 2 (calendar)
        if (step === 2 && window.bookingCalendar) {
            // Refresh calendar if needed
            if (!window.bookingCalendar.selectedDate) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                window.bookingCalendar.selectDate(tomorrow);
            }
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.goToStep(this.currentStep - 1);
        }
    }

    onDateSelected(date) {
        this.bookingData.date = date;
    }

    onTimeSelected(timeSlot) {
        this.bookingData.timeSlot = timeSlot;
    }

    validateTimeSelection() {
        if (!this.bookingData.date || !this.bookingData.timeSlot) {
            this.showError('Please select a date and time for your appointment.');
            return false;
        }
        return true;
    }

    setupFormValidation() {
        const form = document.getElementById('bookingDetailsForm');
        if (!form) return;

        // Real-time validation
        form.querySelectorAll('input[required], textarea[required]').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearFieldError(field));
        });

        // Email validation
        const emailField = document.getElementById('userEmail');
        if (emailField) {
            emailField.addEventListener('blur', () => {
                if (!this.validateEmail(emailField.value)) {
                    this.showFieldError(emailField, 'Please enter a valid email address.');
                }
            });
        }

        // Phone validation
        const phoneField = document.getElementById('userPhone');
        if (phoneField) {
            phoneField.addEventListener('input', (e) => {
                // Format phone number as user types
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 6) {
                    value = value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6, 10);
                } else if (value.length >= 3) {
                    value = value.slice(0, 3) + '-' + value.slice(3);
                }
                e.target.value = value;
            });
        }
    }

    validateField(field) {
        if (field.required && !field.value.trim()) {
            this.showFieldError(field, 'This field is required.');
            return false;
        }
        return true;
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    showFieldError(field, message) {
        field.classList.add('field-error');

        // Remove existing error message
        const existingError = field.parentElement.querySelector('.error-text');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-text';
        errorDiv.textContent = message;
        field.parentElement.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('field-error');
        const errorText = field.parentElement.querySelector('.error-text');
        if (errorText) {
            errorText.remove();
        }
    }

    validateContactDetails() {
        const form = document.getElementById('bookingDetailsForm');
        if (!form) return false;

        let isValid = true;

        // Validate required fields
        form.querySelectorAll('input[required], textarea[required]').forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // Validate email
        const emailField = document.getElementById('userEmail');
        if (emailField && !this.validateEmail(emailField.value)) {
            this.showFieldError(emailField, 'Please enter a valid email address.');
            isValid = false;
        }

        // Store form data if valid
        if (isValid) {
            this.bookingData.userName = document.getElementById('userName').value;
            this.bookingData.userEmail = document.getElementById('userEmail').value;
            this.bookingData.userPhone = document.getElementById('userPhone').value || '';
            this.bookingData.childAge = document.getElementById('childAge').value || '';
            this.bookingData.meetingPurpose = document.getElementById('meetingPurpose').value;
            this.bookingData.specialNeeds = document.getElementById('specialNeeds').value || '';
            this.bookingData.sendReminders = document.getElementById('sendReminders').checked;
            this.bookingData.addToCalendar = document.getElementById('addToCalendar').checked;
        } else {
            this.showError('Please fill in all required fields correctly.');
        }

        return isValid;
    }

    prepareConfirmation() {
        // Populate confirmation details
        const meetingInfo = this.meetingTypes[this.bookingData.meetingType];

        document.getElementById('confirmType').textContent = meetingInfo.name;
        document.getElementById('confirmDate').textContent = this.bookingData.date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('confirmTime').textContent = new Date(this.bookingData.timeSlot.startTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        document.getElementById('confirmDuration').textContent = `${this.bookingData.duration} minutes`;
        document.getElementById('confirmName').textContent = this.bookingData.userName;
        document.getElementById('confirmEmail').textContent = this.bookingData.userEmail;
        document.getElementById('confirmPurpose').textContent = this.bookingData.meetingPurpose;
    }

    async confirmBooking() {
        const confirmBtn = document.getElementById('confirmBooking');
        if (!confirmBtn) return;

        // Initialize API if not already done
        if (!this.api) {
            this.api = window.bookingAPI || new BookingAPI();
        }

        // Disable button and show loading
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Processing...';
        confirmBtn.classList.add('loading');

        try {
            // Prepare appointment data
            const appointmentData = {
                meetingType: this.bookingData.meetingType,
                duration: this.bookingData.duration,
                startTime: this.bookingData.timeSlot.startTime,
                endTime: this.bookingData.timeSlot.endTime,
                date: this.bookingData.date.toISOString(),
                userName: this.bookingData.userName,
                userEmail: this.bookingData.userEmail,
                userPhone: this.bookingData.userPhone,
                childAge: this.bookingData.childAge,
                purpose: this.bookingData.meetingPurpose,
                specialNeeds: this.bookingData.specialNeeds,
                sendReminders: this.bookingData.sendReminders,
                addToCalendar: this.bookingData.addToCalendar,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            // Create appointment through API
            const result = await this.api.createAppointment(appointmentData);

            if (result.success) {
                // Show success message
                this.showBookingSuccess(result.appointment);

                // Update assistant
                if (window.bookingAssistant) {
                    const startTime = new Date(this.bookingData.timeSlot.startTime);
                    const formattedTime = startTime.toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZoneName: 'short'
                    });
                    window.bookingAssistant.addMessage(
                        `Great! Your ${this.meetingTypes[this.bookingData.meetingType].name} with Domina has been confirmed for ${formattedTime}. You'll receive a confirmation email shortly.`,
                        'bot'
                    );
                }

                // Track analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'appointment_booked', {
                        meeting_type: this.bookingData.meetingType,
                        duration: this.bookingData.duration
                    });
                }
            } else {
                throw new Error(result.message || 'Booking failed');
            }

        } catch (error) {
            console.error('Booking error:', error);
            this.showError('There was an error creating your appointment. Please try again or call us at 780-904-1463.');

            // Re-enable button
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Booking';
            confirmBtn.classList.remove('loading');
        }
    }

    showBookingSuccess(appointment) {
        // Hide confirmation form
        document.querySelector('.confirmation-card').style.display = 'none';

        // Show success message
        const successDiv = document.getElementById('bookingSuccess');
        if (successDiv) {
            successDiv.style.display = 'block';

            // Update status indicator
            const statusIndicator = document.querySelector('.confirmation-status');
            if (statusIndicator) {
                statusIndicator.textContent = 'Confirmed';
                statusIndicator.classList.remove('pending');
                statusIndicator.classList.add('confirmed');
            }
        }

        // Save confirmation to local storage for reference
        localStorage.setItem('lastBooking', JSON.stringify({
            confirmationNumber: appointment.confirmationNumber,
            date: appointment.date,
            time: appointment.startTime,
            meetingUrl: appointment.meetingUrl
        }));
    }

    showError(message) {
        // Create error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;

        // Find active step and insert error at top
        const activeStep = document.querySelector('.booking-step.active');
        if (activeStep) {
            // Remove any existing error messages
            activeStep.querySelectorAll('.error-message').forEach(el => el.remove());

            // Insert new error at the beginning
            activeStep.insertBefore(errorDiv, activeStep.firstChild);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        }
    }

    reset() {
        this.currentStep = 1;
        this.bookingData = {
            meetingType: null,
            duration: 30,
            date: null,
            timeSlot: null,
            userName: '',
            userEmail: '',
            userPhone: '',
            childAge: '',
            meetingPurpose: '',
            specialNeeds: '',
            sendReminders: true,
            addToCalendar: true
        };

        // Reset UI
        document.querySelectorAll('.meeting-type-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Reset form
        const form = document.getElementById('bookingDetailsForm');
        if (form) {
            form.reset();
        }

        // Reset calendar
        if (window.bookingCalendar) {
            window.bookingCalendar.reset();
        }

        // Reset assistant
        if (window.bookingAssistant) {
            window.bookingAssistant.reset();
        }

        // Go to first step
        this.goToStep(1);
    }
}

// Make previousStep available globally for onclick handlers
window.previousStep = function() {
    if (window.bookingFlow) {
        window.bookingFlow.previousStep();
    }
};

// Export for use in other modules
window.BookingFlow = BookingFlow;