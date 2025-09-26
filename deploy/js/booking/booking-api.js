/**
 * Booking API Service
 * Handles all API calls for the appointment booking system
 */

class BookingAPI {
    constructor() {
        // For now, using a mock API. Replace with actual backend URL
        this.baseURL = window.location.hostname === 'localhost'
            ? 'http://localhost:3000/api'
            : 'https://api.momnextdoor.ca/api';

        // Mock data for development
        this.useMockData = true; // Set to false when backend is ready
    }

    /**
     * Get available time slots for a specific date
     */
    async getAvailableSlots(date, duration = 30) {
        if (this.useMockData) {
            return this.getMockAvailableSlots(date, duration);
        }

        try {
            const response = await fetch(`${this.baseURL}/availability`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: date.toISOString(),
                    duration: duration,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch available slots');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching available slots:', error);
            // Fallback to mock data if API fails
            return this.getMockAvailableSlots(date, duration);
        }
    }

    /**
     * Get smart slot suggestions based on user preferences
     */
    async getSmartSuggestions(date, duration, userPreferences = {}) {
        if (this.useMockData) {
            return this.getMockSmartSuggestions(date, duration);
        }

        try {
            const response = await fetch(`${this.baseURL}/smart-suggestions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: date.toISOString(),
                    duration: duration,
                    preferences: userPreferences,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch smart suggestions');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching smart suggestions:', error);
            return this.getMockSmartSuggestions(date, duration);
        }
    }

    /**
     * Create a new appointment
     */
    async createAppointment(appointmentData) {
        if (this.useMockData) {
            return this.createMockAppointment(appointmentData);
        }

        try {
            const response = await fetch(`${this.baseURL}/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(appointmentData)
            });

            if (!response.ok) {
                throw new Error('Failed to create appointment');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating appointment:', error);
            // For demo purposes, return mock success
            return this.createMockAppointment(appointmentData);
        }
    }

    /**
     * Cancel an appointment
     */
    async cancelAppointment(appointmentId) {
        if (this.useMockData) {
            return { success: true, message: 'Appointment cancelled successfully' };
        }

        try {
            const response = await fetch(`${this.baseURL}/appointments/${appointmentId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to cancel appointment');
            }

            return await response.json();
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            throw error;
        }
    }

    /**
     * Reschedule an appointment
     */
    async rescheduleAppointment(appointmentId, newDateTime) {
        if (this.useMockData) {
            return { success: true, message: 'Appointment rescheduled successfully' };
        }

        try {
            const response = await fetch(`${this.baseURL}/appointments/${appointmentId}/reschedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newDateTime: newDateTime.toISOString()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to reschedule appointment');
            }

            return await response.json();
        } catch (error) {
            console.error('Error rescheduling appointment:', error);
            throw error;
        }
    }

    /**
     * Process natural language input for the assistant
     */
    async processAssistantInput(input, context = {}) {
        if (this.useMockData) {
            return this.processMockAssistantInput(input, context);
        }

        try {
            const response = await fetch(`${this.baseURL}/assistant/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: input,
                    context: context
                })
            });

            if (!response.ok) {
                throw new Error('Failed to process assistant input');
            }

            return await response.json();
        } catch (error) {
            console.error('Error processing assistant input:', error);
            return this.processMockAssistantInput(input, context);
        }
    }

    // Mock Data Methods (for development/demo)

    getMockAvailableSlots(date, duration) {
        const slots = [];
        const dayStart = new Date(date);
        dayStart.setHours(9, 0, 0, 0);

        // Generate slots from 9 AM to 5 PM
        for (let hour = 9; hour < 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                // Skip lunch hour (12-1 PM)
                if (hour === 12) continue;

                // Random availability (80% chance of being available)
                if (Math.random() > 0.2) {
                    const slotTime = new Date(dayStart);
                    slotTime.setHours(hour, minute, 0, 0);

                    slots.push({
                        startTime: slotTime.toISOString(),
                        endTime: new Date(slotTime.getTime() + duration * 60000).toISOString(),
                        available: true
                    });
                }
            }
        }

        return { slots: slots };
    }

    getMockSmartSuggestions(date, duration) {
        const allSlots = this.getMockAvailableSlots(date, duration);
        const suggestions = [];

        // Pick top 3 slots as smart suggestions
        const preferredTimes = [
            { hour: 10, minute: 0, reason: "Most popular time" },
            { hour: 14, minute: 30, reason: "Quiet afternoon slot" },
            { hour: 11, minute: 0, reason: "Before lunch meeting" }
        ];

        preferredTimes.forEach((pref, index) => {
            const slot = allSlots.slots.find(s => {
                const slotDate = new Date(s.startTime);
                return slotDate.getHours() === pref.hour && slotDate.getMinutes() === pref.minute;
            });

            if (slot) {
                suggestions.push({
                    ...slot,
                    score: 100 - (index * 10),
                    reason: pref.reason
                });
            }
        });

        return {
            suggestions: suggestions,
            allSlots: allSlots.slots
        };
    }

    createMockAppointment(appointmentData) {
        // Simulate API delay
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    appointment: {
                        id: 'apt_' + Math.random().toString(36).substr(2, 9),
                        ...appointmentData,
                        confirmationNumber: 'CONF-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                        meetingUrl: 'https://meet.google.com/abc-defg-hij',
                        calendarEventId: 'cal_' + Math.random().toString(36).substr(2, 9),
                        status: 'confirmed',
                        createdAt: new Date().toISOString()
                    },
                    message: 'Appointment successfully created!'
                });
            }, 1000);
        });
    }

    processMockAssistantInput(input, context) {
        const lowerInput = input.toLowerCase();
        let response = {
            type: 'message',
            message: '',
            action: null,
            data: null
        };

        // Parse different types of input
        if (lowerInput.includes('tomorrow')) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            response.type = 'date_suggestion';
            response.message = "I'll show you available times for tomorrow.";
            response.action = 'select_date';
            response.data = { date: tomorrow };
        } else if (lowerInput.includes('next week')) {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            response.type = 'date_suggestion';
            response.message = "Here are available times for next week.";
            response.action = 'select_date';
            response.data = { date: nextWeek };
        } else if (lowerInput.includes('morning')) {
            response.type = 'time_preference';
            response.message = "I'll show you morning slots (9 AM - 12 PM).";
            response.action = 'filter_times';
            response.data = { timeRange: 'morning' };
        } else if (lowerInput.includes('afternoon')) {
            response.type = 'time_preference';
            response.message = "I'll show you afternoon slots (12 PM - 5 PM).";
            response.action = 'filter_times';
            response.data = { timeRange: 'afternoon' };
        } else if (lowerInput.includes('urgent') || lowerInput.includes('asap')) {
            response.type = 'urgency';
            response.message = "I'll find the earliest available slot for you.";
            response.action = 'find_earliest';
            response.data = { urgent: true };
        } else if (lowerInput.includes('cancel')) {
            response.type = 'cancellation';
            response.message = "To cancel an appointment, please provide your confirmation number.";
            response.action = 'request_confirmation_number';
        } else if (lowerInput.includes('help')) {
            response.type = 'help';
            response.message = "I can help you:\n• Find available appointment times\n• Book consultations with Domina\n• Answer questions about the process\n\nJust let me know what you need!";
        } else {
            // Default response
            response.type = 'clarification';
            response.message = "I can help you book an appointment. Would you like to see available times for this week?";
            response.action = 'show_week_view';
        }

        return response;
    }

    /**
     * Get user's timezone
     */
    getUserTimezone() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    /**
     * Format date/time for display
     */
    formatDateTime(dateString, format = 'full') {
        const date = new Date(dateString);
        const options = {
            full: {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                timeZoneName: 'short'
            },
            date: {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            },
            time: {
                hour: 'numeric',
                minute: '2-digit',
                timeZoneName: 'short'
            },
            short: {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            }
        };

        return date.toLocaleString('en-US', options[format] || options.full);
    }
}

// Export for use in other modules
window.BookingAPI = BookingAPI;