/**
 * Dynamic styles injection
 */
export function initDynamicStyles() {
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                transform: translateX(-50%) translateY(-20px);
                opacity: 0;
            }
            to {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
        }

        /* Scroll Animation Styles */
        .scroll-animate {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .scroll-animate.animate-in {
            opacity: 1;
            transform: translateY(0);
        }

        .trust-point.scroll-animate {
            transition-delay: 0.1s;
        }

        .trust-point:nth-child(2).scroll-animate {
            transition-delay: 0.2s;
        }

        .trust-point:nth-child(3).scroll-animate {
            transition-delay: 0.3s;
        }

        /* Enhanced hover effects */
        .trust-point:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 8px 30px rgba(45, 139, 79, 0.15);
        }

        .service-path:hover {
            transform: translateY(-10px) scale(1.02);
            box-shadow: 0 10px 35px rgba(45, 139, 79, 0.15);
        }

        /* Smooth focus transitions */
        .btn, .phone-cta {
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .hours-status {
            margin-top: 8px;
            font-size: 0.9rem;
            text-align: center;
        }

        .status-open {
            color: #4CAF50;
            font-weight: 600;
        }

        .status-closed {
            color: #f44336;
            font-weight: 600;
        }

        .hours-status small {
            color: #666;
            font-size: 0.8rem;
        }

        /* Enhanced mobile touch feedback */
        @media (max-width: 768px) {
            .btn:active {
                transform: translateY(-1px) scale(0.98);
            }

            .phone-cta:active {
                transform: translateY(-2px) scale(0.98);
            }

            /* Disable parallax on mobile for performance */
            .hero-content > * {
                transform: none !important;
            }

            .trust-point {
                transform: translateY(0) !important;
            }

            /* Reduce animations on mobile */
            .scroll-animate {
                transform: none;
                opacity: 1;
            }
        }

        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
            .scroll-animate,
            .trust-point,
            .service-path {
                transition: none !important;
                transform: none !important;
                animation: none !important;
            }
        }
    `;
    document.head.appendChild(style);
}