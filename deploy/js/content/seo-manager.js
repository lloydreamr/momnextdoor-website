/**
 * SEO Manager - Handles meta tags optimization and structured data injection
 */

let seoConfig = null;

/**
 * Load SEO configuration from JSON file
 */
async function loadSEOConfig() {
    try {
        const response = await fetch('./data/seo-config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        seoConfig = await response.json();
        return seoConfig;
    } catch (error) {
        console.error('Failed to load SEO configuration:', error);
        return null;
    }
}

/**
 * Update meta tags with SEO configuration
 */
function updateMetaTags() {
    if (!seoConfig || !seoConfig.meta) {
        console.warn('SEO config or meta data not available');
        return;
    }

    const { meta } = seoConfig;

    // Update page title
    if (meta.title) {
        document.title = meta.title;
    }

    // Update or create meta description
    updateOrCreateMetaTag('name', 'description', meta.description);

    // Update or create keywords meta tag
    updateOrCreateMetaTag('name', 'keywords', meta.keywords);

    // Update or create author meta tag
    updateOrCreateMetaTag('name', 'author', meta.author);

    // Update or create robots meta tag
    updateOrCreateMetaTag('name', 'robots', meta.robots);

    // Add Edmonton-specific geo tags for local SEO
    updateOrCreateMetaTag('name', 'geo.region', 'CA-AB');
    updateOrCreateMetaTag('name', 'geo.placename', 'Edmonton, Alberta');
    updateOrCreateMetaTag('name', 'geo.position', '53.5461;-113.4938');
    updateOrCreateMetaTag('name', 'ICBM', '53.5461, -113.4938');
}

/**
 * Helper function to update or create meta tags
 */
function updateOrCreateMetaTag(attribute, value, content) {
    if (!content) return;

    let metaTag = document.querySelector(`meta[${attribute}="${value}"]`);

    if (metaTag) {
        metaTag.setAttribute('content', content);
    } else {
        metaTag = document.createElement('meta');
        metaTag.setAttribute(attribute, value);
        metaTag.setAttribute('content', content);
        document.head.appendChild(metaTag);
    }
}

/**
 * Inject structured data (JSON-LD) into the page
 */
function injectStructuredData() {
    if (!seoConfig || !seoConfig.structuredData) {
        console.warn('SEO config or structured data not available');
        return;
    }

    // Remove existing structured data if present
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
        existingScript.remove();
    }

    // Create and inject new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(seoConfig.structuredData, null, 2);
    document.head.appendChild(script);
}

/**
 * Initialize SEO enhancements
 */
export async function initSEO() {
    try {
        await loadSEOConfig();

        if (seoConfig) {
            updateMetaTags();
            injectStructuredData();
            console.log('SEO initialization completed successfully');
        } else {
            console.warn('SEO initialization failed - config not loaded');
        }
    } catch (error) {
        console.error('SEO initialization error:', error);
    }
}

/**
 * Get current SEO configuration (for debugging/testing)
 */
export function getSEOConfig() {
    return seoConfig;
}