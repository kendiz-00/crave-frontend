/**
 * CRAVE Centralized PWA Manager
 * Single authoritative controller for PWA installation, service worker updates, and notification management.
 * Enforces the "FOOD FIRST" user experience policy.
 */
const PWAManager = (function() {
    'use strict';

    const DISMISSAL_KEY = 'crave_pwa_install_dismissed_at';
    const DISMISSAL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days minimum cooldown
    const VISIT_COUNT_KEY = 'crave_pwa_visit_count';
    const CRITICAL_PAGES = ['cart.html', 'checkout.html', 'order-confirmation.html', 'tracking.html'];

    let deferredInstallPrompt = null;
    let swRegistration = null;
    let isInitialized = false;

    // Check if current page is in a protected zero-interruption zone
    function isCriticalPage() {
        if (typeof window === 'undefined') return true;
        const path = window.location.pathname.split('/').pop().toLowerCase();
        if (CRITICAL_PAGES.includes(path)) return true;
        
        // Also check if checkout form, cart modal, or payment processing is active
        const checkoutForm = document.getElementById('checkoutForm');
        const paymentModal = document.querySelector('.payment-modal.show, #paymentModal.show');
        return !!(checkoutForm || paymentModal);
    }

    // Check if app is running in standalone mode (already installed)
    function isInstalled() {
        if (typeof window === 'undefined') return false;
        const isStandaloneMatch = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = window.navigator.standalone === true;
        return isStandaloneMatch || isIOSStandalone;
    }

    // Check if user is eligible for an install prompt
    function isInstallEligible() {
        if (isInstalled()) return false;
        if (!deferredInstallPrompt) return false;
        if (isCriticalPage()) return false;

        // Check 7-day dismissal cooldown
        try {
            const dismissedAt = Number(localStorage.getItem(DISMISSAL_KEY) || '0');
            if (dismissedAt && (Date.now() - dismissedAt < DISMISSAL_COOLDOWN_MS)) {
                return false;
            }
        } catch (e) {}

        return true;
    }

    // Record visit count for engagement tracking
    function trackVisit() {
        try {
            const visits = Number(localStorage.getItem(VISIT_COUNT_KEY) || '0') + 1;
            localStorage.setItem(VISIT_COUNT_KEY, String(visits));
            return visits;
        } catch (e) {
            return 1;
        }
    }

    // Capture install prompt event silently without showing UI
    function bindInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            deferredInstallPrompt = event;
            if (window.deferredPrompt !== undefined) {
                window.deferredPrompt = event;
            }
        });

        window.addEventListener('appinstalled', () => {
            deferredInstallPrompt = null;
            hideInstallUI();
            if (typeof gtag === 'function') {
                gtag('event', 'pwa_installed', { source: 'browser' });
            }
        });
    }

    // Consolidated Service Worker Registration (single source of truth)
    function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return;

        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then((registration) => {
                swRegistration = registration;

                // Check for waiting worker safely
                if (registration.waiting) {
                    notifyUpdateAvailable(registration);
                }

                registration.addEventListener('updatefound', () => {
                    const installingWorker = registration.installing;
                    if (!installingWorker) return;

                    installingWorker.addEventListener('statechange', () => {
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            notifyUpdateAvailable(registration);
                        }
                    });
                });
            }).catch((err) => {
                console.warn('SW registration error:', err);
            });
        });
    }

    // Handle Service Worker update safely (never auto-reload or interrupt critical flows)
    function notifyUpdateAvailable(registration) {
        // NEVER show update toast or reload during critical pages / active checkout
        if (isCriticalPage()) {
            return;
        }

        const toast = document.getElementById('craveUpdateToast');
        if (!toast) return;

        toast.classList.add('is-visible');
        const refreshBtn = document.getElementById('craveRefreshApp');
        if (refreshBtn) {
            refreshBtn.onclick = () => {
                if (registration && registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
                window.location.reload();
            };
        }
    }

    // Trigger explicit PWA install prompt when called by user interaction
    function triggerInstall() {
        if (!deferredInstallPrompt) return false;

        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted CRAVE PWA installation');
            } else {
                dismissInstallPrompt();
            }
            deferredInstallPrompt = null;
        });
        return true;
    }

    // Handle user dismissal with 7-day cooldown
    function dismissInstallPrompt() {
        try {
            localStorage.setItem(DISMISSAL_KEY, String(Date.now()));
        } catch (e) {}
        hideInstallUI();
    }

    // Hide any visible install UI elements
    function hideInstallUI() {
        const card = document.getElementById('craveInstallCard');
        if (card) card.classList.remove('is-visible');
        const postOrderCard = document.getElementById('cravePostOrderInstallCard');
        if (postOrderCard) postOrderCard.style.display = 'none';
    }

    // Request Notification permission explicitly on user button click ONLY
    async function requestNotificationPermission() {
        if (typeof Notification === 'undefined') {
            return { success: false, reason: 'Not supported' };
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                return { success: true, permission };
            }
            return { success: false, permission };
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return { success: false, error };
        }
    }

    // App Badge update helper
    function updateBadge(count) {
        if (!('setAppBadge' in navigator)) return;
        if (count && count > 0) {
            navigator.setAppBadge(Number(count)).catch(() => {});
        } else {
            navigator.clearAppBadge().catch(() => {});
        }
    }

    // Initialize PWAManager
    function init() {
        if (isInitialized) return;
        isInitialized = true;

        trackVisit();
        bindInstallPrompt();
        registerServiceWorker();

        // Bind online/offline events for body styling
        window.addEventListener('offline', () => {
            document.body.classList.add('crave-offline');
        });
        window.addEventListener('online', () => {
            document.body.classList.remove('crave-offline');
        });
        if (!navigator.onLine) {
            document.body.classList.add('crave-offline');
        }
    }

    return {
        init,
        isInstalled,
        isInstallEligible,
        isCriticalPage,
        triggerInstall,
        dismissInstallPrompt,
        requestNotificationPermission,
        updateBadge,
        hasPrompt: () => !!deferredInstallPrompt
    };
})();

// Auto-init PWAManager on DOM load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        PWAManager.init();
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAManager;
}
