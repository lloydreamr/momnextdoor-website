/**
 * Utility functions
 */

/**
 * Format time for display
 */
export function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Detect mobile device
 */
export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
}

/**
 * Show call confirmation for mobile users
 */
export function showCallConfirmation(buttonType) {
    // Create temporary confirmation message
    const confirmation = document.createElement('div');
    confirmation.className = 'call-confirmation';
    confirmation.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #d4a5a5;
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: slideDown 0.3s ease;
    `;
    confirmation.textContent = `Calling now via ${buttonType}...`;

    document.body.appendChild(confirmation);

    // Remove after 3 seconds
    setTimeout(function() {
        if (confirmation.parentNode) {
            confirmation.parentNode.removeChild(confirmation);
        }
    }, 3000);
}