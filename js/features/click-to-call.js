import { CONFIG } from './config.js';
import { isMobileDevice, showCallConfirmation } from './utils.js';

/**
 * Enhanced click-to-call functionality
 */
export function initClickToCall() {
    // Add click tracking to all phone links
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');

    phoneLinks.forEach(function(link) {
        // Add visual feedback for mobile users
        link.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        });

        link.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });

        // Track click events
        link.addEventListener('click', function() {
            const buttonText = this.textContent.trim();
            const buttonType = this.classList.contains('btn-primary') ? 'Get Care Now' :
                              this.classList.contains('btn-secondary') ? 'Join Our Team' :
                              'Phone Number';

            // Log the interaction (can be sent to analytics later)
            console.log('Phone click tracked:', {
                type: buttonType,
                text: buttonText,
                timestamp: new Date().toISOString()
            });

            // Show confirmation on mobile devices
            if (isMobileDevice()) {
                showCallConfirmation(buttonType);
            }
        });
    });

    // Add keyboard accessibility
    phoneLinks.forEach(function(link) {
        link.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}