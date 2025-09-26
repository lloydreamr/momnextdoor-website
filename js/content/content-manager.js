/**
 * Content Manager - Handles JSON-based content loading and management
 */

import { CONFIG } from '../config.js';

// Content cache to avoid repeated requests
const contentCache = new Map();
const loadingPromises = new Map();

/**
 * Content validation schemas for different content types
 */
const contentSchemas = {
    testimonials: {
        required: ['name', 'content'],
        optional: ['image', 'location', 'date', 'rating']
    },
    faq: {
        required: ['question', 'answer'],
        optional: ['category', 'priority', 'id']
    },
    general: {
        required: ['id'],
        optional: ['title', 'content', 'metadata']
    }
};

/**
 * Load content from JSON file with error handling and caching
 */
async function loadContent(contentType, filePath) {
    // Check if already loading
    if (loadingPromises.has(contentType)) {
        return await loadingPromises.get(contentType);
    }

    // Check cache first
    if (contentCache.has(contentType)) {
        return contentCache.get(contentType);
    }

    // Create loading promise
    const loadingPromise = fetchAndProcessContent(contentType, filePath);
    loadingPromises.set(contentType, loadingPromise);

    try {
        const content = await loadingPromise;
        contentCache.set(contentType, content);
        loadingPromises.delete(contentType);
        return content;
    } catch (error) {
        loadingPromises.delete(contentType);
        throw error;
    }
}

/**
 * Fetch and process content from JSON file
 */
async function fetchAndProcessContent(contentType, filePath) {
    try {
        const response = await fetch(filePath);

        if (!response.ok) {
            throw new Error(`Failed to fetch ${contentType}: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Validate content structure
        if (!validateContent(data, contentType)) {
            throw new Error(`Invalid content structure for ${contentType}`);
        }

        console.log(`Successfully loaded ${contentType} content`);
        return data;

    } catch (error) {
        console.error(`Error loading ${contentType} content:`, error);

        // Return fallback content to prevent site breakage
        return getFallbackContent(contentType);
    }
}

/**
 * Validate content against schema
 */
function validateContent(data, contentType) {
    if (!data || typeof data !== 'object') {
        return false;
    }

    const schema = contentSchemas[contentType] || contentSchemas.general;

    // If data is an array, validate each item
    if (Array.isArray(data)) {
        return data.every(item => validateContentItem(item, schema));
    }

    // If data has items array, validate that
    if (data.items && Array.isArray(data.items)) {
        return data.items.every(item => validateContentItem(item, schema));
    }

    // Otherwise validate the data object itself
    return validateContentItem(data, schema);
}

/**
 * Validate individual content item
 */
function validateContentItem(item, schema) {
    if (!item || typeof item !== 'object') {
        return false;
    }

    // Check required fields
    return schema.required.every(field => field in item);
}

/**
 * Get fallback content when loading fails
 */
function getFallbackContent(contentType) {
    const fallbacks = {
        testimonials: {
            items: [],
            message: 'Testimonials temporarily unavailable'
        },
        faq: {
            items: [],
            message: 'FAQ content temporarily unavailable'
        },
        general: {
            items: [],
            message: 'Content temporarily unavailable'
        }
    };

    return fallbacks[contentType] || fallbacks.general;
}

/**
 * Content Manager API
 */
export const ContentManager = {
    /**
     * Load testimonials content
     */
    async loadTestimonials() {
        const config = CONFIG.content?.testimonials || {};
        const filePath = config.dataPath || './data/testimonials.json';
        return await loadContent('testimonials', filePath);
    },

    /**
     * Load FAQ content
     */
    async loadFAQ() {
        const config = CONFIG.content?.faq || {};
        const filePath = config.dataPath || './data/faq.json';
        return await loadContent('faq', filePath);
    },

    /**
     * Load generic content by type
     */
    async loadContentByType(contentType, filePath) {
        if (!contentType || !filePath) {
            throw new Error('Content type and file path are required');
        }
        return await loadContent(contentType, filePath);
    },

    /**
     * Clear content cache
     */
    clearCache(contentType = null) {
        if (contentType) {
            contentCache.delete(contentType);
        } else {
            contentCache.clear();
        }
    },

    /**
     * Check if content is cached
     */
    isCached(contentType) {
        return contentCache.has(contentType);
    },

    /**
     * Get cached content without loading
     */
    getCached(contentType) {
        return contentCache.get(contentType) || null;
    }
};

/**
 * Initialize content management system
 */
export function initContentManager() {
    if (!CONFIG.content?.enabled) {
        console.log('Content management system disabled in configuration');
        return;
    }

    console.log('Content management system initialized');

    // Pre-load critical content if configured
    const { preload = [] } = CONFIG.content || {};

    preload.forEach(async (contentType) => {
        try {
            switch (contentType) {
                case 'testimonials':
                    await ContentManager.loadTestimonials();
                    break;
                case 'faq':
                    await ContentManager.loadFAQ();
                    break;
                default:
                    console.warn(`Unknown preload content type: ${contentType}`);
            }
        } catch (error) {
            console.error(`Failed to preload ${contentType}:`, error);
        }
    });
}