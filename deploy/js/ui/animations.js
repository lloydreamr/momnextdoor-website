import { isMobileDevice } from './utils.js';

/**
 * Scroll-triggered animations and effects
 */
export function initScrollEffects() {
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
export function initParallax() {
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