// MomNextDoor Website Main JavaScript Entry Point
import { initClickToCall } from './click-to-call.js';
import { initBusinessHours } from './business-hours.js';
import { initAccessibility } from './accessibility.js';
import { initAnalytics } from './analytics.js';
import { initScrollEffects, initParallax } from './animations.js';
import { initDynamicStyles } from './styles.js';

/**
 * Main application initialization
 */
(function() {
    'use strict';

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initClickToCall();
        initBusinessHours();
        initAccessibility();
        initAnalytics();
        initScrollEffects();
        initParallax();
        initDynamicStyles();
    });
})();