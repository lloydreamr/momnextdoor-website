import { CONFIG } from './config.js';
import { formatTime } from './utils.js';

/**
 * Business hours indicator
 */
export function initBusinessHours() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    const isBusinessHours = CONFIG.businessHours.days.includes(currentDay) &&
                           currentHour >= CONFIG.businessHours.start &&
                           currentHour < CONFIG.businessHours.end;

    // Add status indicator to phone displays
    const phoneDisplays = document.querySelectorAll('.phone-display, .contact-main');

    phoneDisplays.forEach(function(display) {
        const statusElement = document.createElement('div');
        statusElement.className = 'hours-status';

        if (isBusinessHours) {
            statusElement.innerHTML = '<span class="status-open">🟢 Currently Available</span>';
            statusElement.className += ' status-open';
        } else {
            statusElement.innerHTML = '<span class="status-closed">🔴 Currently Closed</span>';
            statusElement.className += ' status-closed';

            // Add next available time
            const nextAvailable = getNextAvailableTime();
            if (nextAvailable) {
                statusElement.innerHTML += `<br><small>Available: ${nextAvailable}</small>`;
            }
        }

        display.appendChild(statusElement);
    });
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