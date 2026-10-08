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
    const CRITICAL_PAGES = ['cart.html', 'checkout.html', 'order-confirmation.html'];
    const INSTALL_CARD_ID = 'craveInstallCard';
    const INSTALL_BUTTON_ID = 'craveInstallBtn';
    const INSTALL_DISMISS_ID = 'craveInstallDismiss';

    let deferredInstallPrompt = null;
    let swRegistration = null;
    let isInitialized = false;
    let installCardDismissedThisSession = false;

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

    // Create the install notification once, then reveal it only after a native prompt exists.
    function createInstallCard() {
        if (document.getElementById(INSTALL_CARD_ID)) return;

        const card = document.createElement('aside');
        card.id = INSTALL_CARD_ID;
        card.className = 'crave-install-card';
        card.setAttribute('role', 'status');
        card.setAttribute('aria-live', 'polite');
        card.setAttribute('aria-hidden', 'true');
        card.innerHTML = `
            <div class="crave-install-card__content">
                <div class="crave-install-card__brand">
                    <img class="crave-install-card__logo" src="images/logo.png" alt="CRAVE" width="48" height="48">
                    <div>
                        <p class="crave-install-card__eyebrow">Install CRAVE</p>
                        <h2>Get CRAVE right from your home screen.</h2>
                    </div>
                </div>
                <p class="crave-install-card__copy">Enjoy faster ordering, easy reorders, and your rewards wherever you are.</p>
                <div class="crave-install-card__actions">
                    <button id="${INSTALL_BUTTON_ID}" class="crave-install-card__button" type="button">Install CRAVE</button>
                    <button id="${INSTALL_DISMISS_ID}" class="crave-install-card__dismiss" type="button">Not now</button>
                </div>
            </div>`;

        document.body.appendChild(card);

        document.getElementById(INSTALL_BUTTON_ID).addEventListener('click', triggerInstall);
        document.getElementById(INSTALL_DISMISS_ID).addEventListener('click', dismissInstallPrompt);
    }

    // Show the card only when the browser has confirmed a native install prompt.
    function isDismissedWithinCooldown() {
        try {
            const dismissedAt = Number(localStorage.getItem(DISMISSAL_KEY) || '0');
            return Boolean(dismissedAt && (Date.now() - dismissedAt < DISMISSAL_COOLDOWN_MS));
        } catch (e) {
            return false;
        }
    }

    function showInstallUI() {
        if (isInstalled() || isCriticalPage() || installCardDismissedThisSession || isDismissedWithinCooldown()) return;

        const card = document.getElementById(INSTALL_CARD_ID);
        if (!card) return;

        card.setAttribute('aria-hidden', 'false');
        card.classList.add('is-visible');
    }

    // Check if user is eligible for an install prompt
    function isInstallEligible() {
        if (isInstalled()) return false;
        if (!deferredInstallPrompt) return false;
        if (isCriticalPage()) return false;
        return !isDismissedWithinCooldown();
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

    // Capture the native prompt and reveal the notification only after it is available.
    function bindInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            deferredInstallPrompt = event;
            if (window.deferredPrompt !== undefined) {
                window.deferredPrompt = event;
            }
            createInstallCard();
            showInstallUI();
        });

        window.addEventListener('appinstalled', () => {
            deferredInstallPrompt = null;
            installCardDismissedThisSession = true;
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

    // Trigger the native browser install prompt only from the user's explicit click.
    function triggerInstall() {
        if (!deferredInstallPrompt) return false;

        const prompt = deferredInstallPrompt;
        deferredInstallPrompt = null;
        prompt.prompt();
        prompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted CRAVE PWA installation');
            } else {
                dismissInstallPrompt();
            }
        });
        return true;
    }

    // Handle dismissal for the current visit and the existing 7-day preference.
    function dismissInstallPrompt() {
        installCardDismissedThisSession = true;
        try {
            localStorage.setItem(DISMISSAL_KEY, String(Date.now()));
        } catch (e) {}
        hideInstallUI();
    }

    // Hide the install notification without affecting other PWA functionality.
    function hideInstallUI() {
        const card = document.getElementById(INSTALL_CARD_ID);
        if (!card) return;
        card.classList.remove('is-visible');
        card.setAttribute('aria-hidden', 'true');
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
        createInstallCard();
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
