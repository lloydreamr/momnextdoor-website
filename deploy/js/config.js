// Configuration constants
export const CONFIG = {
    phoneNumber: '7809041463',
    businessHours: {
        start: 8, // 8 AM
        end: 20,  // 8 PM
        days: [2, 3, 4, 5, 6, 0] // Tuesday through Sunday (0 = Sunday)
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