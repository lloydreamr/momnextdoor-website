// MomNextDoor Website JavaScript
// Enhanced click-to-call functionality and user experience improvements

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        phoneNumber: '7809041463',
        businessHours: {
            start: 8, // 8 AM
            end: 20,  // 8 PM
            days: [2, 3, 4, 5, 6, 0] // Tuesday through Sunday (0 = Sunday)
        }
    };

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initClickToCall();
        initBusinessHours();
        initAccessibility();
        initAnalytics();
        initScrollEffects();
        initParallax();
    });

    /**
     * Enhanced click-to-call functionality
     */
    function initClickToCall() {
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

    /**
     * Business hours indicator
     */
    function initBusinessHours() {
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
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(CONFIG.businessHours.start, 0, 0, 0);

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

    /**
     * Format time for display
     */
    function formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    /**
     * Accessibility improvements
     */
    function initAccessibility() {
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

    /**
     * Basic analytics and user interaction tracking
     */
    function initAnalytics() {
        // Track page load
        console.log('MomNextDoor page loaded:', {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });

        // Track scroll behavior (to understand user engagement)
        let maxScroll = 0;
        window.addEventListener('scroll', function() {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
            }
        });

        // Track before page unload
        window.addEventListener('beforeunload', function() {
            console.log('Page unload tracked:', {
                maxScroll: maxScroll + '%',
                timeOnPage: (Date.now() - performance.now()) / 1000 + ' seconds'
            });
        });
    }

    /**
     * Show call confirmation for mobile users
     */
    function showCallConfirmation(buttonType) {
        // Create temporary confirmation message
        const confirmation = document.createElement('div');
        confirmation.className = 'call-confirmation';
        confirmation.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #d4a5a5;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: 600;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            animation: slideDown 0.3s ease;
        `;
        confirmation.textContent = `Calling now via ${buttonType}...`;

        document.body.appendChild(confirmation);

        // Remove after 3 seconds
        setTimeout(function() {
            if (confirmation.parentNode) {
                confirmation.parentNode.removeChild(confirmation);
            }
        }, 3000);
    }

    /**
     * Detect mobile device
     */
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    /**
     * Scroll-triggered animations and effects
     */
    function initScrollEffects() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                } else {
                    entry.target.classList.remove('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements that should animate on scroll
        const animateElements = document.querySelectorAll('.trust-point, .service-path, .business-info, .contact-details');
        animateElements.forEach(function(el) {
            el.classList.add('scroll-animate');
            observer.observe(el);
        });
    }

    /**
     * Parallax scroll effects
     */
    function initParallax() {
        let ticking = false;

        function updateParallax() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.3;

            // Apply parallax to hero section elements
            const heroElements = document.querySelectorAll('.hero-content > *');
            heroElements.forEach(function(el, idx) {
                const elementRate = rate + (idx * 10);
                el.style.transform = `translateY(${elementRate}px)`;
            });

            // Subtle parallax on trust points
            const trustPoints = document.querySelectorAll('.trust-point');
            trustPoints.forEach(function(el, index) {
                const elementRate = (scrolled - el.offsetTop) * 0.1;
                if (Math.abs(elementRate) < 50) { // Limit movement
                    el.style.transform = `translateY(${elementRate}px)`;
                }
            });

            ticking = false;
        }

        function requestParallaxUpdate() {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }

        // Only enable on non-mobile devices for performance
        if (!isMobileDevice()) {
            window.addEventListener('scroll', requestParallaxUpdate);
        }
    }

    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                transform: translateX(-50%) translateY(-20px);
                opacity: 0;
            }
            to {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
        }

        /* Scroll Animation Styles */
        .scroll-animate {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .scroll-animate.animate-in {
            opacity: 1;
            transform: translateY(0);
        }

        .trust-point.scroll-animate {
            transition-delay: 0.1s;
        }

        .trust-point:nth-child(2).scroll-animate {
            transition-delay: 0.2s;
        }

        .trust-point:nth-child(3).scroll-animate {
            transition-delay: 0.3s;
        }

        /* Enhanced hover effects */
        .trust-point:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 8px 30px rgba(45, 139, 79, 0.15);
        }

        .service-path:hover {
            transform: translateY(-10px) scale(1.02);
            box-shadow: 0 10px 35px rgba(45, 139, 79, 0.15);
        }

        /* Smooth focus transitions */
        .btn, .phone-cta {
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .hours-status {
            margin-top: 8px;
            font-size: 0.9rem;
            text-align: center;
        }

        .status-open {
            color: #4CAF50;
            font-weight: 600;
        }

        .status-closed {
            color: #f44336;
            font-weight: 600;
        }

        .hours-status small {
            color: #666;
            font-size: 0.8rem;
        }

        /* Enhanced mobile touch feedback */
        @media (max-width: 768px) {
            .btn:active {
                transform: translateY(-1px) scale(0.98);
            }

            .phone-cta:active {
                transform: translateY(-2px) scale(0.98);
            }

            /* Disable parallax on mobile for performance */
            .hero-content > * {
                transform: none !important;
            }

            .trust-point {
                transform: translateY(0) !important;
            }

            /* Reduce animations on mobile */
            .scroll-animate {
                transform: none;
                opacity: 1;
            }
        }

        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
            .scroll-animate,
            .trust-point,
            .service-path {
                transition: none !important;
                transform: none !important;
                animation: none !important;
            }
        }
    `;
    document.head.appendChild(style);

})();