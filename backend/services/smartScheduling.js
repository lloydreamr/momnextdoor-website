/**
 * Smart Scheduling Service
 * Provides intelligent appointment slot suggestions based on patterns and preferences
 */

const { query } = require('../config/database');
const { calendarService } = require('./googleCalendar');
const { zonedTimeToUtc, utcToZonedTime } = require('date-fns-tz');
const { addMinutes, differenceInMinutes, format } = require('date-fns');

class SmartSchedulingService {
    /**
     * Get smart suggestions for appointment slots
     */
    async getSmartSuggestions(date, duration, userPreferences = {}, timezone = 'America/Edmonton') {
        try {
            // Get available slots from Google Calendar
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            // Get all available slots
            const availableSlots = await calendarService.getAvailability(startDate, endDate);

            // Filter slots by duration
            const validSlots = availableSlots.filter(slot => {
                const slotDuration = differenceInMinutes(new Date(slot.endTime), new Date(slot.startTime));
                return slotDuration >= duration;
            });

            // Score and rank slots
            const scoredSlots = await this.scoreSlots(validSlots, userPreferences, duration);

            // Get top suggestions
            const suggestions = scoredSlots
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map(slot => ({
                    ...slot,
                    reason: this.getReasonForScore(slot)
                }));

            return {
                suggestions,
                allSlots: validSlots
            };
        } catch (error) {
            console.error('Error getting smart suggestions:', error);
            throw error;
        }
    }

    /**
     * Score appointment slots based on various factors
     */
    async scoreSlots(slots, userPreferences, duration) {
        const scoredSlots = [];

        for (const slot of slots) {
            let score = 100; // Base score
            const slotStart = new Date(slot.startTime);
            const hour = slotStart.getHours();
            const dayOfWeek = slotStart.getDay();

            // Time of day scoring
            if (hour >= 10 && hour <= 11) {
                score += 30; // Morning prime time
                slot.timeCategory = 'morning_prime';
            } else if (hour >= 14 && hour <= 15) {
                score += 25; // Afternoon prime time
                slot.timeCategory = 'afternoon_prime';
            } else if (hour === 9) {
                score += 20; // Early morning
                slot.timeCategory = 'early_morning';
            } else if (hour >= 16) {
                score += 15; // Late afternoon
                slot.timeCategory = 'late_afternoon';
            }

            // Day of week scoring
            if (dayOfWeek >= 2 && dayOfWeek <= 4) {
                score += 15; // Tuesday to Thursday preferred
                slot.dayPreference = 'midweek';
            } else if (dayOfWeek === 1) {
                score += 10; // Monday
                slot.dayPreference = 'monday';
            } else if (dayOfWeek === 5) {
                score += 5; // Friday
                slot.dayPreference = 'friday';
            }

            // User preference matching
            if (userPreferences.userId) {
                const patternScore = await this.getUserPatternScore(userPreferences.userId, slotStart);
                score += patternScore;
                slot.patternMatch = patternScore > 0;
            }

            // Buffer time scoring
            const hasGoodBuffer = await this.checkBufferTime(slot);
            if (hasGoodBuffer) {
                score += 20;
                slot.hasBuffer = true;
            }

            // Duration matching
            if (duration === 30) {
                score += 10; // Standard duration preference
            } else if (duration === 15) {
                score += 15; // Quick meetings preferred for certain times
            }

            // Not immediately after lunch
            if (hour === 13) {
                score -= 10;
                slot.postLunch = true;
            }

            // Energy level optimization (avoid back-to-back intensive sessions)
            if (duration >= 60) {
                const hasBreakBefore = await this.checkBreakBefore(slot);
                if (hasBreakBefore) {
                    score += 15;
                    slot.hasBreakBefore = true;
                }
            }

            scoredSlots.push({
                ...slot,
                score,
                duration
            });
        }

        return scoredSlots;
    }

    /**
     * Get user pattern score for a specific time slot
     */
    async getUserPatternScore(userId, slotTime) {
        try {
            const dayOfWeek = slotTime.getDay();
            const hour = slotTime.getHours();

            const result = await query(
                `SELECT booking_count, success_rate
                 FROM booking_patterns
                 WHERE user_id = $1 AND day_of_week = $2 AND hour_of_day = $3`,
                [userId, dayOfWeek, hour]
            );

            if (result.rows.length > 0) {
                const pattern = result.rows[0];
                return Math.round(pattern.booking_count * 5 + (pattern.success_rate || 0.5) * 10);
            }

            return 0;
        } catch (error) {
            console.error('Error getting user pattern score:', error);
            return 0;
        }
    }

    /**
     * Check if slot has good buffer time
     */
    async checkBufferTime(slot) {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);

        // Check 15 minutes before and after
        const bufferBefore = new Date(slotStart);
        bufferBefore.setMinutes(bufferBefore.getMinutes() - 15);

        const bufferAfter = new Date(slotEnd);
        bufferAfter.setMinutes(bufferAfter.getMinutes() + 15);

        try {
            const busyTimes = await calendarService.getBusyTimes(bufferBefore, bufferAfter);

            // Good buffer if no meetings within 15 minutes
            return busyTimes.length === 0;
        } catch (error) {
            console.error('Error checking buffer time:', error);
            return true; // Assume good buffer on error
        }
    }

    /**
     * Check if there's a break before the slot (for long meetings)
     */
    async checkBreakBefore(slot) {
        const slotStart = new Date(slot.startTime);
        const checkStart = new Date(slotStart);
        checkStart.setMinutes(checkStart.getMinutes() - 30);

        try {
            const busyTimes = await calendarService.getBusyTimes(checkStart, slotStart);
            return busyTimes.length === 0;
        } catch (error) {
            console.error('Error checking break before:', error);
            return true;
        }
    }

    /**
     * Get human-readable reason for slot score
     */
    getReasonForScore(slot) {
        const reasons = [];

        if (slot.timeCategory === 'morning_prime') {
            reasons.push('Most popular morning time');
        } else if (slot.timeCategory === 'afternoon_prime') {
            reasons.push('Optimal afternoon slot');
        } else if (slot.timeCategory === 'early_morning') {
            reasons.push('Early bird special');
        } else if (slot.timeCategory === 'late_afternoon') {
            reasons.push('End of day availability');
        }

        if (slot.dayPreference === 'midweek') {
            reasons.push('Best day for focus');
        }

        if (slot.hasBuffer) {
            reasons.push('Good buffer time');
        }

        if (slot.patternMatch) {
            reasons.push('Matches your preferences');
        }

        if (slot.hasBreakBefore) {
            reasons.push('Fresh start after break');
        }

        return reasons.length > 0 ? reasons[0] : 'Available slot';
    }

    /**
     * Learn from booking patterns
     */
    async updateBookingPattern(userId, appointment) {
        try {
            const appointmentDate = new Date(appointment.scheduled_start);
            const dayOfWeek = appointmentDate.getDay();
            const hour = appointmentDate.getHours();

            await query(
                `INSERT INTO booking_patterns (user_id, day_of_week, hour_of_day, booking_count, avg_duration_minutes)
                 VALUES ($1, $2, $3, 1, $4)
                 ON CONFLICT (user_id, day_of_week, hour_of_day)
                 DO UPDATE SET
                    booking_count = booking_patterns.booking_count + 1,
                    avg_duration_minutes = (booking_patterns.avg_duration_minutes * booking_patterns.booking_count + $4) / (booking_patterns.booking_count + 1),
                    updated_at = NOW()`,
                [userId, dayOfWeek, hour, appointment.duration_minutes]
            );

            console.log('Updated booking pattern for user:', userId);
        } catch (error) {
            console.error('Error updating booking pattern:', error);
        }
    }

    /**
     * Get optimal slots for a week
     */
    async getWeekOptimalSlots(startDate, endDate, duration = 30) {
        const optimalSlots = [];
        const current = new Date(startDate);

        while (current <= endDate) {
            const daySlots = await this.getSmartSuggestions(current, duration);
            if (daySlots.suggestions.length > 0) {
                optimalSlots.push({
                    date: format(current, 'yyyy-MM-dd'),
                    topSlot: daySlots.suggestions[0]
                });
            }
            current.setDate(current.getDate() + 1);
        }

        return optimalSlots;
    }

    /**
     * Predict best times for a user
     */
    async predictBestTimes(userId) {
        try {
            const result = await query(
                `SELECT day_of_week, hour_of_day, booking_count, success_rate
                 FROM booking_patterns
                 WHERE user_id = $1
                 ORDER BY booking_count DESC, success_rate DESC
                 LIMIT 5`,
                [userId]
            );

            return result.rows.map(row => ({
                dayOfWeek: row.day_of_week,
                hour: row.hour_of_day,
                confidence: (row.booking_count * 0.7 + (row.success_rate || 0.5) * 0.3) / 1
            }));
        } catch (error) {
            console.error('Error predicting best times:', error);
            return [];
        }
    }

    /**
     * Check for scheduling conflicts
     */
    async checkConflicts(startTime, endTime) {
        try {
            const busyTimes = await calendarService.getBusyTimes(
                new Date(startTime),
                new Date(endTime)
            );

            return busyTimes.length > 0;
        } catch (error) {
            console.error('Error checking conflicts:', error);
            return false;
        }
    }

    /**
     * Get availability summary for a month
     */
    async getMonthAvailabilitySummary(year, month) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        const summary = {
            totalSlots: 0,
            availableSlots: 0,
            busiestDays: [],
            recommendedBookingDays: []
        };

        const current = new Date(startDate);
        while (current <= endDate) {
            if (current.getDay() !== 0 && current.getDay() !== 6) {
                const daySlots = await calendarService.getAvailability(
                    current,
                    new Date(current.getTime() + 24 * 60 * 60 * 1000)
                );

                summary.totalSlots += 16; // 8 hours * 2 slots per hour
                summary.availableSlots += daySlots.length;

                if (daySlots.length > 10) {
                    summary.recommendedBookingDays.push(format(current, 'yyyy-MM-dd'));
                }
            }
            current.setDate(current.getDate() + 1);
        }

        summary.utilizationRate = ((summary.totalSlots - summary.availableSlots) / summary.totalSlots) * 100;

        return summary;
    }
}

// Create singleton instance
const smartSchedulingService = new SmartSchedulingService();

module.exports = {
    smartSchedulingService,
    getSmartSuggestions: (date, duration, preferences, timezone) =>
        smartSchedulingService.getSmartSuggestions(date, duration, preferences, timezone)
};