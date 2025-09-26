/**
 * Google Calendar Integration Service
 */

const { google } = require('googleapis');
const { OAuth2 } = google.auth;

class GoogleCalendarService {
    constructor() {
        this.calendar = null;
        this.auth = null;
    }

    /**
     * Initialize Google Calendar API
     */
    async initialize() {
        try {
            // Create OAuth2 client
            this.auth = new OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URL
            );

            // Set refresh token
            this.auth.setCredentials({
                refresh_token: process.env.GOOGLE_REFRESH_TOKEN
            });

            // Initialize calendar API
            this.calendar = google.calendar({ version: 'v3', auth: this.auth });

            // Test connection
            await this.testConnection();

            console.log('Google Calendar service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Google Calendar:', error);
            throw error;
        }
    }

    /**
     * Test calendar connection
     */
    async testConnection() {
        try {
            const response = await this.calendar.calendarList.list({
                maxResults: 1
            });
            return response.data;
        } catch (error) {
            console.error('Calendar connection test failed:', error);
            throw error;
        }
    }

    /**
     * Get available time slots for a date range
     */
    async getAvailability(startDate, endDate) {
        try {
            const response = await this.calendar.freebusy.query({
                requestBody: {
                    timeMin: startDate.toISOString(),
                    timeMax: endDate.toISOString(),
                    timeZone: process.env.DEFAULT_TIMEZONE || 'America/Edmonton',
                    items: [{ id: process.env.DOMINA_CALENDAR_ID || 'primary' }]
                }
            });

            const busySlots = response.data.calendars[process.env.DOMINA_CALENDAR_ID || 'primary'].busy || [];

            // Convert busy slots to available slots
            const availableSlots = this.calculateAvailableSlots(startDate, endDate, busySlots);

            return availableSlots;
        } catch (error) {
            console.error('Error fetching availability:', error);
            throw error;
        }
    }

    /**
     * Calculate available slots from busy periods
     */
    calculateAvailableSlots(startDate, endDate, busySlots) {
        const slots = [];
        const slotDuration = 30; // Default 30 minutes
        const workStart = 9; // 9 AM
        const workEnd = 17; // 5 PM
        const lunchStart = 12; // 12 PM
        const lunchEnd = 13; // 1 PM

        // Create Date object for iteration
        const current = new Date(startDate);
        current.setHours(workStart, 0, 0, 0);

        while (current < endDate) {
            const dayOfWeek = current.getDay();

            // Skip weekends (Saturday = 6, Sunday = 0)
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                current.setDate(current.getDate() + 1);
                current.setHours(workStart, 0, 0, 0);
                continue;
            }

            // Generate slots for the day
            const dayEnd = new Date(current);
            dayEnd.setHours(workEnd, 0, 0, 0);

            while (current < dayEnd) {
                const slotStart = new Date(current);
                const slotEnd = new Date(current);
                slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

                const hour = current.getHours();

                // Skip lunch hour
                if (hour >= lunchStart && hour < lunchEnd) {
                    current.setHours(lunchEnd, 0, 0, 0);
                    continue;
                }

                // Check if slot conflicts with busy periods
                const isAvailable = !busySlots.some(busy => {
                    const busyStart = new Date(busy.start);
                    const busyEnd = new Date(busy.end);
                    return (slotStart >= busyStart && slotStart < busyEnd) ||
                           (slotEnd > busyStart && slotEnd <= busyEnd);
                });

                if (isAvailable) {
                    slots.push({
                        startTime: slotStart.toISOString(),
                        endTime: slotEnd.toISOString(),
                        available: true
                    });
                }

                // Move to next slot
                current.setMinutes(current.getMinutes() + slotDuration);
            }

            // Move to next day
            current.setDate(current.getDate() + 1);
            current.setHours(workStart, 0, 0, 0);
        }

        return slots;
    }

    /**
     * Create a calendar event
     */
    async createEvent(appointmentData) {
        try {
            const event = {
                summary: `${appointmentData.meetingType} - ${appointmentData.userName}`,
                description: `
Purpose: ${appointmentData.purpose}
Phone: ${appointmentData.userPhone || 'Not provided'}
Child's Age: ${appointmentData.childAge || 'N/A'}
Special Needs: ${appointmentData.specialNeeds || 'None specified'}

Confirmation Number: ${appointmentData.confirmationNumber}
                `.trim(),
                start: {
                    dateTime: appointmentData.startTime,
                    timeZone: appointmentData.timezone || 'America/Edmonton'
                },
                end: {
                    dateTime: appointmentData.endTime,
                    timeZone: appointmentData.timezone || 'America/Edmonton'
                },
                attendees: [
                    { email: appointmentData.userEmail, displayName: appointmentData.userName }
                ],
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 }, // 1 day before
                        { method: 'popup', minutes: 60 }, // 1 hour before
                    ]
                },
                conferenceData: {
                    createRequest: {
                        requestId: appointmentData.id,
                        conferenceSolutionKey: { type: 'hangoutsMeet' }
                    }
                },
                sendNotifications: true
            };

            const response = await this.calendar.events.insert({
                calendarId: process.env.DOMINA_CALENDAR_ID || 'primary',
                resource: event,
                conferenceDataVersion: 1,
                sendUpdates: 'all'
            });

            return {
                eventId: response.data.id,
                meetingUrl: response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri,
                htmlLink: response.data.htmlLink
            };
        } catch (error) {
            console.error('Error creating calendar event:', error);
            throw error;
        }
    }

    /**
     * Update a calendar event
     */
    async updateEvent(eventId, updates) {
        try {
            const response = await this.calendar.events.patch({
                calendarId: process.env.DOMINA_CALENDAR_ID || 'primary',
                eventId: eventId,
                resource: updates,
                sendUpdates: 'all'
            });

            return response.data;
        } catch (error) {
            console.error('Error updating calendar event:', error);
            throw error;
        }
    }

    /**
     * Cancel/delete a calendar event
     */
    async cancelEvent(eventId) {
        try {
            await this.calendar.events.delete({
                calendarId: process.env.DOMINA_CALENDAR_ID || 'primary',
                eventId: eventId,
                sendUpdates: 'all'
            });

            return { success: true };
        } catch (error) {
            console.error('Error cancelling calendar event:', error);
            throw error;
        }
    }

    /**
     * Get event details
     */
    async getEvent(eventId) {
        try {
            const response = await this.calendar.events.get({
                calendarId: process.env.DOMINA_CALENDAR_ID || 'primary',
                eventId: eventId
            });

            return response.data;
        } catch (error) {
            console.error('Error fetching event:', error);
            throw error;
        }
    }

    /**
     * List events for a date range
     */
    async listEvents(startDate, endDate) {
        try {
            const response = await this.calendar.events.list({
                calendarId: process.env.DOMINA_CALENDAR_ID || 'primary',
                timeMin: startDate.toISOString(),
                timeMax: endDate.toISOString(),
                singleEvents: true,
                orderBy: 'startTime'
            });

            return response.data.items || [];
        } catch (error) {
            console.error('Error listing events:', error);
            throw error;
        }
    }

    /**
     * Get busy times for a date range
     */
    async getBusyTimes(startDate, endDate) {
        try {
            const response = await this.calendar.freebusy.query({
                requestBody: {
                    timeMin: startDate.toISOString(),
                    timeMax: endDate.toISOString(),
                    items: [{ id: process.env.DOMINA_CALENDAR_ID || 'primary' }]
                }
            });

            return response.data.calendars[process.env.DOMINA_CALENDAR_ID || 'primary'].busy || [];
        } catch (error) {
            console.error('Error fetching busy times:', error);
            throw error;
        }
    }

    /**
     * Watch for calendar changes
     */
    async watchCalendar(webhookUrl) {
        try {
            const response = await this.calendar.events.watch({
                calendarId: process.env.DOMINA_CALENDAR_ID || 'primary',
                requestBody: {
                    id: `watch-${Date.now()}`,
                    type: 'web_hook',
                    address: webhookUrl
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error setting up calendar watch:', error);
            throw error;
        }
    }
}

// Create singleton instance
const calendarService = new GoogleCalendarService();

// Initialize function for server startup
async function initializeGoogleCalendar() {
    await calendarService.initialize();
}

module.exports = {
    calendarService,
    initializeGoogleCalendar
};