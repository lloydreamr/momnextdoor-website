// MomNextDoor Website Main JavaScript Entry Point
import { initClickToCall } from './click-to-call.js';
import { initBusinessHours } from './business-hours.js';
import { initAccessibility } from './accessibility.js';
import { initAnalytics } from './analytics.js';
import { initScrollEffects, initParallax } from './animations.js';
import { initDynamicStyles } from './styles.js';
import { initSEO } from './content/seo-manager.js';
import { initContentManager } from './content/content-manager.js';
import { initTestimonials } from './content/testimonials-manager.js';
import { initFAQ } from './content/faq-manager.js';

/**
 * Main application initialization
 */
(function() {
    'use strict';

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initSEO();
        initContentManager();
        initTestimonials();
        initFAQ();
        initClickToCall();
        initBusinessHours();
        initAccessibility();
        initAnalytics();
        initScrollEffects();
        initParallax();
        initDynamicStyles();
    });
})();