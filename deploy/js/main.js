// MomNextDoor Website Main JavaScript Entry Point

// Core functionality
import { initBusinessHours } from './core/business-hours.js';

// UI components
import { initAccessibility } from './ui/accessibility.js';
import { initScrollEffects, initParallax } from './ui/animations.js';
import { initDynamicStyles } from './ui/styles.js';

// Features
import { initClickToCall } from './features/click-to-call.js';
import { initAnalytics } from './features/analytics.js';

// Content management
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