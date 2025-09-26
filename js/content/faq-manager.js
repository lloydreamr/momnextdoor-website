/**
 * FAQ Manager - Handles accessible expandable FAQ section
 */

import { ContentManager } from './content-manager.js';
import { CONFIG } from '../config.js';

let faqData = null;
let faqContainer = null;

/**
 * Initialize FAQ system
 */
export async function initFAQ() {
    if (!CONFIG.content?.faq?.enabled) {
        console.log('FAQ system disabled in configuration');
        return;
    }

    try {
        // Load FAQ data
        faqData = await ContentManager.loadFAQ();

        // Create FAQ section if it doesn't exist
        createFAQSection();

        // Display FAQ items
        displayFAQItems();

        // Setup accessibility features
        setupAccessibility();

        console.log('FAQ system initialized successfully');

    } catch (error) {
        console.error('Failed to initialize FAQ system:', error);
        displayFallbackContent();
    }
}

/**
 * Create FAQ section in the HTML
 */
function createFAQSection() {
    // Check if FAQ section already exists
    faqContainer = document.querySelector('.faq-section');

    if (!faqContainer) {
        // Find appropriate place to insert FAQ (after testimonials or hero section)
        const testimonialsSection = document.querySelector('.testimonials-section');
        const heroSection = document.querySelector('.hero');
        const insertAfter = testimonialsSection || heroSection;
        const mainElement = document.querySelector('.main');

        if (insertAfter && mainElement) {
            faqContainer = document.createElement('section');
            faqContainer.className = 'faq-section';
            faqContainer.innerHTML = `
                <div class="container">
                    <h2 class="faq-title">Frequently Asked Questions</h2>
                    <p class="faq-subtitle">Common questions about our special needs care services in Edmonton</p>
                    <div class="faq-list">
                        <!-- FAQ items will be inserted here -->
                    </div>
                </div>
            `;

            // Insert after testimonials or hero section
            insertAfter.parentNode.insertBefore(faqContainer, insertAfter.nextSibling);
        }
    }
}

/**
 * Display FAQ items in the container
 */
function displayFAQItems() {
    if (!faqData?.items || faqData.items.length === 0) {
        displayFallbackContent();
        return;
    }

    const faqList = faqContainer.querySelector('.faq-list');

    if (!faqList) {
        console.error('FAQ list container not found');
        return;
    }

    // Clear existing content
    faqList.innerHTML = '';

    // Sort FAQ items by priority (higher priority first)
    const sortedFAQ = [...faqData.items].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Create FAQ items
    sortedFAQ.forEach((faqItem, index) => {
        const faqElement = createFAQItem(faqItem, index);
        faqList.appendChild(faqElement);
    });
}

/**
 * Create individual FAQ item with accessibility features
 */
function createFAQItem(faqItem, index) {
    const faqElement = document.createElement('div');
    faqElement.className = 'faq-item';

    const faqId = faqItem.id || `faq-${index}`;
    const buttonId = `${faqId}-button`;
    const contentId = `${faqId}-content`;

    faqElement.innerHTML = `
        <div class="faq-question">
            <button
                class="faq-button"
                id="${buttonId}"
                aria-expanded="false"
                aria-controls="${contentId}"
                data-faq-index="${index}"
            >
                <span class="faq-question-text">${faqItem.question}</span>
                <span class="faq-icon" aria-hidden="true">
                    <svg class="faq-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6,9 12,15 18,9"></polyline>
                    </svg>
                </span>
            </button>
        </div>
        <div
            class="faq-answer"
            id="${contentId}"
            role="region"
            aria-labelledby="${buttonId}"
            aria-hidden="true"
        >
            <div class="faq-answer-content">
                ${formatFAQAnswer(faqItem.answer)}
                ${faqItem.category ? `<div class="faq-category" aria-label="Category">${faqItem.category}</div>` : ''}
            </div>
        </div>
    `;

    return faqElement;
}

/**
 * Format FAQ answer content (supports basic markdown-like formatting)
 */
function formatFAQAnswer(answer) {
    if (!answer) return '';

    // Convert line breaks to paragraphs
    return answer
        .split('\n\n')
        .map(paragraph => `<p>${paragraph.trim()}</p>`)
        .join('');
}

/**
 * Setup accessibility features and event handlers
 */
function setupAccessibility() {
    if (!faqContainer) return;

    // Add click event listeners to FAQ buttons
    faqContainer.addEventListener('click', handleFAQClick);

    // Add keyboard event listeners
    faqContainer.addEventListener('keydown', handleFAQKeydown);

    // Add focus management
    setupFocusManagement();
}

/**
 * Handle FAQ button clicks
 */
function handleFAQClick(event) {
    const button = event.target.closest('.faq-button');
    if (!button) return;

    event.preventDefault();
    toggleFAQItem(button);
}

/**
 * Handle keyboard navigation for FAQ items
 */
function handleFAQKeydown(event) {
    const button = event.target.closest('.faq-button');
    if (!button) return;

    switch (event.key) {
        case 'Enter':
        case ' ': // Space key
            event.preventDefault();
            toggleFAQItem(button);
            break;

        case 'ArrowDown':
            event.preventDefault();
            focusNextFAQItem(button);
            break;

        case 'ArrowUp':
            event.preventDefault();
            focusPreviousFAQItem(button);
            break;

        case 'Home':
            event.preventDefault();
            focusFirstFAQItem();
            break;

        case 'End':
            event.preventDefault();
            focusLastFAQItem();
            break;

        case 'Escape':
            if (button.getAttribute('aria-expanded') === 'true') {
                event.preventDefault();
                collapseFAQItem(button);
            }
            break;
    }
}

/**
 * Toggle FAQ item expanded/collapsed state
 */
function toggleFAQItem(button) {
    const isExpanded = button.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
        collapseFAQItem(button);
    } else {
        expandFAQItem(button);
    }
}

/**
 * Expand FAQ item
 */
function expandFAQItem(button) {
    const contentId = button.getAttribute('aria-controls');
    const content = document.getElementById(contentId);
    const faqItem = button.closest('.faq-item');

    if (!content || !faqItem) return;

    // Update ARIA attributes
    button.setAttribute('aria-expanded', 'true');
    content.setAttribute('aria-hidden', 'false');

    // Add CSS classes for animation
    faqItem.classList.add('faq-item-expanded');
    content.classList.add('faq-answer-expanded');

    // Announce to screen readers
    announceToScreenReader(`FAQ answer expanded: ${button.querySelector('.faq-question-text').textContent}`);

    // Scroll into view if needed (with some offset for better visibility)
    setTimeout(() => {
        const rect = faqItem.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

        if (!isVisible) {
            faqItem.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
        }
    }, 100);
}

/**
 * Collapse FAQ item
 */
function collapseFAQItem(button) {
    const contentId = button.getAttribute('aria-controls');
    const content = document.getElementById(contentId);
    const faqItem = button.closest('.faq-item');

    if (!content || !faqItem) return;

    // Update ARIA attributes
    button.setAttribute('aria-expanded', 'false');
    content.setAttribute('aria-hidden', 'true');

    // Remove CSS classes for animation
    faqItem.classList.remove('faq-item-expanded');
    content.classList.remove('faq-answer-expanded');

    // Announce to screen readers
    announceToScreenReader(`FAQ answer collapsed`);
}

/**
 * Focus management functions
 */
function focusNextFAQItem(currentButton) {
    const buttons = Array.from(faqContainer.querySelectorAll('.faq-button'));
    const currentIndex = buttons.indexOf(currentButton);
    const nextIndex = (currentIndex + 1) % buttons.length;
    buttons[nextIndex].focus();
}

function focusPreviousFAQItem(currentButton) {
    const buttons = Array.from(faqContainer.querySelectorAll('.faq-button'));
    const currentIndex = buttons.indexOf(currentButton);
    const prevIndex = currentIndex === 0 ? buttons.length - 1 : currentIndex - 1;
    buttons[prevIndex].focus();
}

function focusFirstFAQItem() {
    const firstButton = faqContainer.querySelector('.faq-button');
    if (firstButton) firstButton.focus();
}

function focusLastFAQItem() {
    const buttons = faqContainer.querySelectorAll('.faq-button');
    if (buttons.length > 0) buttons[buttons.length - 1].focus();
}

/**
 * Setup focus management for better accessibility
 */
function setupFocusManagement() {
    const buttons = faqContainer.querySelectorAll('.faq-button');

    buttons.forEach(button => {
        // Add focus and blur event listeners for visual feedback
        button.addEventListener('focus', () => {
            button.closest('.faq-item').classList.add('faq-item-focused');
        });

        button.addEventListener('blur', () => {
            button.closest('.faq-item').classList.remove('faq-item-focused');
        });
    });
}

/**
 * Announce content to screen readers
 */
function announceToScreenReader(message) {
    // Create or update live region for screen reader announcements
    let liveRegion = document.getElementById('faq-live-region');

    if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'faq-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.position = 'absolute';
        liveRegion.style.left = '-10000px';
        liveRegion.style.width = '1px';
        liveRegion.style.height = '1px';
        liveRegion.style.overflow = 'hidden';
        document.body.appendChild(liveRegion);
    }

    // Clear and set new message
    liveRegion.textContent = '';
    setTimeout(() => {
        liveRegion.textContent = message;
    }, 100);
}

/**
 * Display fallback content when FAQ can't be loaded
 */
function displayFallbackContent() {
    if (!faqContainer) {
        createFAQSection();
    }

    const faqList = faqContainer.querySelector('.faq-list');
    if (faqList) {
        faqList.innerHTML = `
            <div class="faq-item">
                <div class="faq-question">
                    <div class="faq-button" role="button" tabindex="0">
                        <span class="faq-question-text">FAQ content will be available soon</span>
                    </div>
                </div>
                <div class="faq-answer" aria-hidden="true">
                    <div class="faq-answer-content">
                        <p>We're working on adding helpful FAQ content. Please contact us directly for any questions.</p>
                    </div>
                </div>
            </div>
        `;
    }
}

/**
 * Collapse all FAQ items (utility function)
 */
export function collapseAllFAQ() {
    if (!faqContainer) return;

    const expandedButtons = faqContainer.querySelectorAll('.faq-button[aria-expanded="true"]');
    expandedButtons.forEach(button => collapseFAQItem(button));
}

/**
 * Expand all FAQ items (utility function)
 */
export function expandAllFAQ() {
    if (!faqContainer) return;

    const collapsedButtons = faqContainer.querySelectorAll('.faq-button[aria-expanded="false"]');
    collapsedButtons.forEach(button => expandFAQItem(button));
}