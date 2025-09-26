/**
 * Testimonials Manager - Handles testimonials display with rotation and lazy loading
 */

import { ContentManager } from './content-manager.js';
import { CONFIG } from '../config.js';

let testimonialsData = null;
let currentTestimonialIndex = 0;
let rotationInterval = null;
let testimonialsContainer = null;

// Lazy loading observer
let imageObserver = null;

/**
 * Initialize testimonials system
 */
export async function initTestimonials() {
    if (!CONFIG.content?.testimonials?.enabled) {
        console.log('Testimonials system disabled in configuration');
        return;
    }

    try {
        // Load testimonials data
        testimonialsData = await ContentManager.loadTestimonials();

        // Create testimonials section if it doesn't exist
        createTestimonialsSection();

        // Initialize lazy loading for images
        initLazyLoading();

        // Display testimonials
        displayTestimonials();

        // Start rotation if configured
        const rotationConfig = CONFIG.content.testimonials.rotation || {};
        if (rotationConfig.enabled !== false) {
            startRotation(rotationConfig.interval || 8000);
        }

        console.log('Testimonials system initialized successfully');

    } catch (error) {
        console.error('Failed to initialize testimonials system:', error);
        displayFallbackContent();
    }
}

/**
 * Create testimonials section in the HTML
 */
function createTestimonialsSection() {
    // Check if testimonials section already exists
    testimonialsContainer = document.querySelector('.testimonials-section');

    if (!testimonialsContainer) {
        // Find appropriate place to insert testimonials (after hero section)
        const heroSection = document.querySelector('.hero');
        const mainElement = document.querySelector('.main');

        if (heroSection && mainElement) {
            testimonialsContainer = document.createElement('section');
            testimonialsContainer.className = 'testimonials-section';
            testimonialsContainer.innerHTML = `
                <div class="container">
                    <h2 class="testimonials-title">What Families Say</h2>
                    <div class="testimonials-slider">
                        <div class="testimonials-track">
                            <!-- Testimonials will be inserted here -->
                        </div>
                        <div class="testimonials-navigation">
                            <button class="testimonials-prev" aria-label="Previous testimonial">&larr;</button>
                            <div class="testimonials-dots"></div>
                            <button class="testimonials-next" aria-label="Next testimonial">&rarr;</button>
                        </div>
                    </div>
                </div>
            `;

            // Insert after hero section
            heroSection.parentNode.insertBefore(testimonialsContainer, heroSection.nextSibling);

            // Add event listeners for navigation
            setupNavigation();
        }
    }
}

/**
 * Display testimonials in the container
 */
function displayTestimonials() {
    if (!testimonialsData?.items || testimonialsData.items.length === 0) {
        displayFallbackContent();
        return;
    }

    const track = testimonialsContainer.querySelector('.testimonials-track');
    const dotsContainer = testimonialsContainer.querySelector('.testimonials-dots');

    if (!track || !dotsContainer) {
        console.error('Testimonials DOM elements not found');
        return;
    }

    // Clear existing content
    track.innerHTML = '';
    dotsContainer.innerHTML = '';

    // Create testimonial cards
    testimonialsData.items.forEach((testimonial, index) => {
        const card = createTestimonialCard(testimonial, index);
        track.appendChild(card);

        // Create dot indicator
        const dot = document.createElement('button');
        dot.className = 'testimonials-dot';
        dot.setAttribute('aria-label', `View testimonial ${index + 1}`);
        dot.addEventListener('click', () => showTestimonial(index));
        dotsContainer.appendChild(dot);
    });

    // Show first testimonial
    showTestimonial(0);
}

/**
 * Create individual testimonial card
 */
function createTestimonialCard(testimonial, index) {
    const card = document.createElement('div');
    card.className = 'testimonial-card';
    card.setAttribute('data-index', index);

    const hasImage = testimonial.image && testimonial.image.trim() !== '';

    card.innerHTML = `
        <div class="testimonial-content">
            <blockquote class="testimonial-quote">
                "${testimonial.content}"
            </blockquote>
            <div class="testimonial-meta">
                <div class="testimonial-author">
                    ${hasImage ? `
                    <div class="testimonial-avatar">
                        <img
                            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23f0f0f0'/%3E%3C/svg%3E"
                            data-src="${testimonial.image}"
                            alt="${testimonial.name}"
                            class="lazy-image testimonial-image"
                            loading="lazy"
                        >
                    </div>
                    ` : ''}
                    <div class="testimonial-details">
                        <cite class="testimonial-name">${testimonial.name}</cite>
                        ${testimonial.location ? `<div class="testimonial-location">${testimonial.location}</div>` : ''}
                        ${testimonial.rating ? `<div class="testimonial-rating">${'★'.repeat(testimonial.rating)}</div>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    return card;
}

/**
 * Show specific testimonial by index
 */
function showTestimonial(index) {
    if (!testimonialsData?.items || index < 0 || index >= testimonialsData.items.length) {
        return;
    }

    currentTestimonialIndex = index;

    // Update active card
    const cards = testimonialsContainer.querySelectorAll('.testimonial-card');
    cards.forEach((card, i) => {
        card.classList.toggle('active', i === index);
    });

    // Update active dot
    const dots = testimonialsContainer.querySelectorAll('.testimonials-dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });

    // Update track position for sliding effect
    const track = testimonialsContainer.querySelector('.testimonials-track');
    if (track) {
        track.style.transform = `translateX(-${index * 100}%)`;
    }
}

/**
 * Setup navigation event listeners
 */
function setupNavigation() {
    const prevBtn = testimonialsContainer.querySelector('.testimonials-prev');
    const nextBtn = testimonialsContainer.querySelector('.testimonials-next');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const newIndex = currentTestimonialIndex > 0
                ? currentTestimonialIndex - 1
                : testimonialsData.items.length - 1;
            showTestimonial(newIndex);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const newIndex = currentTestimonialIndex < testimonialsData.items.length - 1
                ? currentTestimonialIndex + 1
                : 0;
            showTestimonial(newIndex);
        });
    }
}

/**
 * Start automatic rotation
 */
function startRotation(interval = 8000) {
    stopRotation(); // Clear any existing interval

    rotationInterval = setInterval(() => {
        if (!testimonialsData?.items || testimonialsData.items.length <= 1) {
            return;
        }

        const nextIndex = currentTestimonialIndex < testimonialsData.items.length - 1
            ? currentTestimonialIndex + 1
            : 0;

        showTestimonial(nextIndex);
    }, interval);
}

/**
 * Stop automatic rotation
 */
function stopRotation() {
    if (rotationInterval) {
        clearInterval(rotationInterval);
        rotationInterval = null;
    }
}

/**
 * Initialize lazy loading for images
 */
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        imageObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');

                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        img.classList.add('loaded');
                        imageObserver.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px'
        });

        // Observe existing lazy images
        observeLazyImages();
    }
}

/**
 * Observe lazy images for loading
 */
function observeLazyImages() {
    if (imageObserver) {
        const lazyImages = testimonialsContainer?.querySelectorAll('.lazy-image') || [];
        lazyImages.forEach((img) => imageObserver.observe(img));
    }
}

/**
 * Display fallback content when testimonials can't be loaded
 */
function displayFallbackContent() {
    if (!testimonialsContainer) {
        createTestimonialsSection();
    }

    const track = testimonialsContainer.querySelector('.testimonials-track');
    if (track) {
        track.innerHTML = `
            <div class="testimonial-card active">
                <div class="testimonial-content">
                    <blockquote class="testimonial-quote">
                        "Testimonials will be displayed here once they're available."
                    </blockquote>
                    <div class="testimonial-meta">
                        <div class="testimonial-author">
                            <div class="testimonial-details">
                                <cite class="testimonial-name">Loading...</cite>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Hide navigation for fallback
    const navigation = testimonialsContainer.querySelector('.testimonials-navigation');
    if (navigation) {
        navigation.style.display = 'none';
    }
}

/**
 * Pause rotation on user interaction
 */
export function pauseRotation() {
    stopRotation();
}

/**
 * Resume rotation after user interaction
 */
export function resumeRotation() {
    const rotationConfig = CONFIG.content?.testimonials?.rotation || {};
    if (rotationConfig.enabled !== false) {
        startRotation(rotationConfig.interval || 8000);
    }
}