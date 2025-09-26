import { CONFIG } from './config.js';

/**
 * Accessibility improvements
 */
export function initAccessibility() {
    // Add screen reader announcements for CTA buttons
    const ctaButtons = document.querySelectorAll('.btn');
    ctaButtons.forEach(function(button) {
        if (!button.getAttribute('aria-label')) {
            const text = button.textContent.trim();
            button.setAttribute('aria-label', `${text} - Call ${CONFIG.phoneNumber}`);
        }
    });

    // Improve phone number accessibility
    const phoneNumbers = document.querySelectorAll('a[href^="tel:"]');
    phoneNumbers.forEach(function(link) {
        if (!link.getAttribute('aria-label')) {
            link.setAttribute('aria-label', `Call ${CONFIG.phoneNumber}`);
        }
    });

    // Add keyboard navigation improvements
    document.addEventListener('keydown', function(e) {
        // Allow Enter key to activate phone links
        if (e.key === 'Enter' && e.target.tagName === 'A' && e.target.href.startsWith('tel:')) {
            e.target.click();
        }
    });
}