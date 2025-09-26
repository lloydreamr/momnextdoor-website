/**
 * Enhanced analytics and performance monitoring
 */

import { CONFIG } from './config.js';

// Analytics state
let maxScroll = 0;
let pageLoadTime = performance.now();
let webVitalsData = {};
let userInteractions = [];

/**
 * Initialize enhanced analytics system
 */
export function initAnalytics() {
    // Initialize Core Web Vitals monitoring
    initWebVitals();

    // Track page load with performance metrics
    trackPageLoad();

    // Setup scroll tracking
    setupScrollTracking();

    // Setup interaction tracking for new content sections
    setupContentInteractionTracking();

    // Setup phone call conversion tracking
    setupPhoneCallTracking();

    // Track page unload with comprehensive metrics
    setupUnloadTracking();

    // Setup performance monitoring
    setupPerformanceMonitoring();

    console.log('Enhanced analytics system initialized');
}

/**
 * Track detailed page load information
 */
function trackPageLoad() {
    const loadData = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        },
        performance: {
            loadTime: performance.now(),
            domComplete: 0,
            firstContentfulPaint: 0
        },
        features: {
            testimonials: !!document.querySelector('.testimonials-section'),
            faq: !!document.querySelector('.faq-section')
        }
    };

    // Get performance timing if available
    if (performance.timing) {
        loadData.performance.domComplete = performance.timing.domComplete - performance.timing.navigationStart;
    }

    // Track paint timing
    if (performance.getEntriesByType) {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcp) {
            loadData.performance.firstContentfulPaint = fcp.startTime;
        }
    }

    trackEvent('page_load', loadData);
}

/**
 * Setup scroll tracking with engagement zones
 */
function setupScrollTracking() {
    let scrollTimeout;

    window.addEventListener('scroll', function() {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);

        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;

            // Track milestone scroll percentages
            if (scrollPercent >= 25 && !userInteractions.includes('scroll_25')) {
                trackEvent('scroll_milestone', { percentage: 25, timestamp: Date.now() });
                userInteractions.push('scroll_25');
            }
            if (scrollPercent >= 50 && !userInteractions.includes('scroll_50')) {
                trackEvent('scroll_milestone', { percentage: 50, timestamp: Date.now() });
                userInteractions.push('scroll_50');
            }
            if (scrollPercent >= 75 && !userInteractions.includes('scroll_75')) {
                trackEvent('scroll_milestone', { percentage: 75, timestamp: Date.now() });
                userInteractions.push('scroll_75');
            }
            if (scrollPercent >= 90 && !userInteractions.includes('scroll_90')) {
                trackEvent('scroll_milestone', { percentage: 90, timestamp: Date.now() });
                userInteractions.push('scroll_90');
            }
        }

        // Debounced scroll end tracking
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            trackEvent('scroll_end', { percentage: scrollPercent });
        }, 150);
    });
}

/**
 * Setup interaction tracking for testimonials and FAQ
 */
function setupContentInteractionTracking() {
    // Track testimonials interactions
    document.addEventListener('click', function(event) {
        // Testimonials navigation tracking
        if (event.target.closest('.testimonials-prev')) {
            trackEvent('testimonials_navigation', { action: 'previous', timestamp: Date.now() });
        } else if (event.target.closest('.testimonials-next')) {
            trackEvent('testimonials_navigation', { action: 'next', timestamp: Date.now() });
        } else if (event.target.closest('.testimonials-dot')) {
            const index = Array.from(document.querySelectorAll('.testimonials-dot')).indexOf(event.target);
            trackEvent('testimonials_navigation', { action: 'dot', index: index, timestamp: Date.now() });
        }

        // FAQ interactions tracking
        if (event.target.closest('.faq-button')) {
            const button = event.target.closest('.faq-button');
            const isExpanding = button.getAttribute('aria-expanded') === 'false';
            const faqIndex = button.getAttribute('data-faq-index');
            const questionText = button.querySelector('.faq-question-text')?.textContent.substring(0, 50);

            trackEvent('faq_interaction', {
                action: isExpanding ? 'expand' : 'collapse',
                index: faqIndex,
                question: questionText,
                timestamp: Date.now()
            });
        }
    });

    // Track testimonials view time
    setupTestimonialsViewTracking();

    // Track FAQ section engagement
    setupFAQEngagementTracking();
}

/**
 * Track testimonials viewing patterns
 */
function setupTestimonialsViewTracking() {
    const testimonialsSection = document.querySelector('.testimonials-section');
    if (!testimonialsSection) return;

    let viewStartTime = null;
    let isInView = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isInView) {
                isInView = true;
                viewStartTime = Date.now();
                trackEvent('testimonials_view_start', { timestamp: viewStartTime });
            } else if (!entry.isIntersecting && isInView) {
                isInView = false;
                if (viewStartTime) {
                    const viewDuration = Date.now() - viewStartTime;
                    trackEvent('testimonials_view_end', {
                        duration: viewDuration,
                        engagement: viewDuration > 5000 ? 'high' : viewDuration > 2000 ? 'medium' : 'low'
                    });
                }
            }
        });
    }, { threshold: 0.5 });

    observer.observe(testimonialsSection);
}

/**
 * Track FAQ section engagement patterns
 */
function setupFAQEngagementTracking() {
    const faqSection = document.querySelector('.faq-section');
    if (!faqSection) return;

    let faqViewStartTime = null;
    let faqInView = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !faqInView) {
                faqInView = true;
                faqViewStartTime = Date.now();
                trackEvent('faq_view_start', { timestamp: faqViewStartTime });
            } else if (!entry.isIntersecting && faqInView) {
                faqInView = false;
                if (faqViewStartTime) {
                    const viewDuration = Date.now() - faqViewStartTime;
                    const expandedCount = document.querySelectorAll('.faq-item-expanded').length;
                    trackEvent('faq_view_end', {
                        duration: viewDuration,
                        expandedFAQs: expandedCount,
                        engagement: expandedCount > 2 ? 'high' : expandedCount > 0 ? 'medium' : 'low'
                    });
                }
            }
        });
    }, { threshold: 0.3 });

    observer.observe(faqSection);
}

/**
 * Track phone call conversions from various sources
 */
function setupPhoneCallTracking() {
    document.addEventListener('click', function(event) {
        const phoneLink = event.target.closest('a[href^="tel:"]');
        if (phoneLink) {
            const sourceElement = event.target.closest('.testimonials-section, .faq-section, .hero, .header');
            let source = 'unknown';

            if (sourceElement) {
                if (sourceElement.classList.contains('testimonials-section')) {
                    source = 'testimonials';
                } else if (sourceElement.classList.contains('faq-section')) {
                    source = 'faq';
                } else if (sourceElement.classList.contains('hero')) {
                    source = 'hero';
                } else if (sourceElement.classList.contains('header')) {
                    source = 'header';
                }
            }

            trackEvent('phone_call_click', {
                source: source,
                phoneNumber: phoneLink.href.replace('tel:', ''),
                timestamp: Date.now(),
                scrollPosition: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
            });
        }
    });
}

/**
 * Initialize Core Web Vitals monitoring
 */
function initWebVitals() {
    // Track Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
        try {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                webVitalsData.lcp = lastEntry.startTime;
                trackEvent('web_vitals_lcp', { value: lastEntry.startTime });
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // Track First Input Delay (FID)
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    webVitalsData.fid = entry.processingStart - entry.startTime;
                    trackEvent('web_vitals_fid', { value: entry.processingStart - entry.startTime });
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });

            // Track Cumulative Layout Shift (CLS)
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                webVitalsData.cls = clsValue;
                trackEvent('web_vitals_cls', { value: clsValue });
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });

        } catch (error) {
            console.warn('Performance Observer not fully supported:', error);
        }
    }
}

/**
 * Setup performance monitoring for content loading
 */
function setupPerformanceMonitoring() {
    // Monitor image loading performance
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
        img.addEventListener('load', () => {
            trackEvent('image_load', {
                index: index,
                src: img.src.substring(0, 100),
                loadTime: performance.now() - pageLoadTime
            });
        });

        img.addEventListener('error', () => {
            trackEvent('image_error', {
                index: index,
                src: img.src.substring(0, 100)
            });
        });
    });

    // Monitor resource loading
    if (performance.getEntriesByType) {
        setTimeout(() => {
            const resources = performance.getEntriesByType('resource');
            const resourceSummary = {
                total: resources.length,
                css: resources.filter(r => r.name.includes('.css')).length,
                js: resources.filter(r => r.name.includes('.js')).length,
                images: resources.filter(r => r.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)).length,
                averageLoadTime: resources.reduce((sum, r) => sum + r.duration, 0) / resources.length
            };
            trackEvent('resource_loading_summary', resourceSummary);
        }, 3000);
    }
}

/**
 * Setup comprehensive unload tracking
 */
function setupUnloadTracking() {
    window.addEventListener('beforeunload', function() {
        const sessionData = {
            maxScroll: maxScroll + '%',
            timeOnPage: Math.round((Date.now() - pageLoadTime) / 1000),
            interactions: userInteractions.length,
            webVitals: webVitalsData,
            timestamp: new Date().toISOString()
        };

        trackEvent('page_unload', sessionData);

        // Send any queued analytics data
        sendQueuedEvents();
    });

    // Also track on visibility change (for mobile/tab switching)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            trackEvent('page_hidden', {
                timeVisible: Math.round((Date.now() - pageLoadTime) / 1000),
                maxScroll: maxScroll
            });
        } else {
            trackEvent('page_visible', {
                timestamp: Date.now()
            });
        }
    });
}

/**
 * Track custom events with enhanced data
 */
function trackEvent(eventName, eventData = {}) {
    const enrichedData = {
        event: eventName,
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
        referrer: document.referrer || 'direct',
        sessionId: getSessionId(),
        ...eventData
    };

    // Log to console (replace with actual analytics service)
    console.log('Analytics Event:', enrichedData);

    // Store in session storage for potential batch sending
    storeEventForBatching(enrichedData);
}

/**
 * Generate or retrieve session ID
 */
function getSessionId() {
    let sessionId = sessionStorage.getItem('momnextdoor-session-id');
    if (!sessionId) {
        sessionId = Date.now().toString(36) + Math.random().toString(36);
        sessionStorage.setItem('momnextdoor-session-id', sessionId);
    }
    return sessionId;
}

/**
 * Store events for potential batch sending
 */
function storeEventForBatching(eventData) {
    const events = JSON.parse(sessionStorage.getItem('momnextdoor-analytics-queue') || '[]');
    events.push(eventData);

    // Keep only last 50 events to prevent storage overflow
    const recentEvents = events.slice(-50);
    sessionStorage.setItem('momnextdoor-analytics-queue', JSON.stringify(recentEvents));
}

/**
 * Send queued events (placeholder for actual analytics service integration)
 */
function sendQueuedEvents() {
    const events = JSON.parse(sessionStorage.getItem('momnextdoor-analytics-queue') || '[]');

    if (events.length > 0) {
        // This would typically send to an analytics service
        console.log('Sending queued analytics events:', events.length, 'events');

        // Clear the queue after sending
        sessionStorage.removeItem('momnextdoor-analytics-queue');
    }
}

/**
 * Get analytics summary for debugging
 */
export function getAnalyticsSummary() {
    return {
        sessionId: getSessionId(),
        timeOnPage: Math.round((Date.now() - pageLoadTime) / 1000),
        maxScroll: maxScroll,
        interactions: userInteractions.length,
        webVitals: webVitalsData,
        queuedEvents: JSON.parse(sessionStorage.getItem('momnextdoor-analytics-queue') || '[]').length
    };
}