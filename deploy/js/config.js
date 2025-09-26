// Configuration constants
export const CONFIG = {
    phoneNumber: '7809041463',
    businessHours: {
        start: 0, // 24/7 service
        end: 24,  // 24/7 service
        days: [0, 1, 2, 3, 4, 5, 6] // All 7 days of the week
    },
    seo: {
        enabled: true,
        configPath: './data/seo-config.json',
        structuredDataEnabled: true,
        localSEOEnabled: true
    },
    content: {
        enabled: true,
        preload: ['testimonials', 'faq'],
        testimonials: {
            dataPath: './data/testimonials.json',
            enabled: true,
            rotation: {
                enabled: true,
                interval: 8000
            }
        },
        faq: {
            dataPath: './data/faq.json',
            enabled: true
        }
    }
};