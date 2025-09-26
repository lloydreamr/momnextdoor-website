import { CONFIG } from './config.js';
import { formatTime } from './utils.js';

/**
 * Business hours indicator
 */
export function initBusinessHours() {
    // 24/7 availability - no need for status indicators
    // Function kept for compatibility but no longer adds status elements
}

/**
 * Calculate next available time
 */
function getNextAvailableTime() {
    const now = new Date();

    // If it's before business hours today and we're open today
    if (now.getHours() < CONFIG.businessHours.start &&
        CONFIG.businessHours.days.includes(now.getDay())) {
        const today = new Date(now);
        today.setHours(CONFIG.businessHours.start, 0, 0, 0);
        return `Today at ${formatTime(today)}`;
    }

    // Find next business day
    for (let i = 1; i <= 7; i++) {
        const nextDay = new Date(now);
        nextDay.setDate(nextDay.getDate() + i);

        if (CONFIG.businessHours.days.includes(nextDay.getDay())) {
            nextDay.setHours(CONFIG.businessHours.start, 0, 0, 0);
            const dayName = nextDay.toLocaleDateString('en-US', { weekday: 'long' });
            return `${dayName} at ${formatTime(nextDay)}`;
        }
    }

    return null;
}