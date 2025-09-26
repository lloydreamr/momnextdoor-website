/**
 * Basic analytics and user interaction tracking
 */
export function initAnalytics() {
    // Track page load
    console.log('MomNextDoor page loaded:', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        }
    });

    // Track scroll behavior (to understand user engagement)
    let maxScroll = 0;
    window.addEventListener('scroll', function() {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
        }
    });

    // Track before page unload
    window.addEventListener('beforeunload', function() {
        console.log('Page unload tracked:', {
            maxScroll: maxScroll + '%',
            timeOnPage: (Date.now() - performance.now()) / 1000 + ' seconds'
        });
    });
}