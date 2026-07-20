(function () {
    'use strict';

    const MEASUREMENT_ID = 'G-F8CVWBJESV';
    const CURRENCY = 'GHS';
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const state = {
        initialized: false,
        pageViewSent: false,
        scrollThresholds: [25, 50, 75, 100],
        seenScroll: new Set(),
        seenReadingComplete: false,
        sessionId: '',
        sessionStart: Date.now(),
        sessionPageViews: 0,
        isReturningUser: false,
        lastCartSnapshot: null,
        searchActive: false,
        searchQuery: '',
        lastCartValue: 0,
        lastCartCount: 0,
        checkoutStarted: false
    };

    function ensureGtag() {
        if (window.gtag) return window.gtag;
        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag() {
            window.dataLayer.push(arguments);
        };
        return window.gtag;
    }

    const gtag = ensureGtag();

    function track(eventName, params) {
        gtag('event', eventName, Object.assign({
            page_title: document.title,
            page_location: window.location.href,
            page_path: window.location.pathname,
            currency: CURRENCY
        }, params || {}));
    }

    function trackEcommerce(eventName, itemName, itemCategory, itemVariant, price, quantity, extra) {
        const safePrice = Number(price) || 0;
        const safeQuantity = Number(quantity) || 1;
        track(eventName, Object.assign({
            item_name: itemName || 'Unknown Item',
            item_category: itemCategory || 'Food',
            item_variant: itemVariant || 'standard',
            price: safePrice,
            quantity: safeQuantity,
            currency: CURRENCY,
            value: safePrice * safeQuantity
        }, extra || {}));
    }

    function getPathKey() {
        return window.location.pathname.replace(/\/$/, '') || '/';
    }

    function getPageType() {
        const path = getPathKey().toLowerCase();
        if (path.includes('menu')) return 'menu';
        if (path.includes('checkout')) return 'checkout';
        if (path.includes('cart')) return 'cart';
        if (path.includes('reservation')) return 'reservation';
        if (path.includes('about')) return 'about';
        if (path.includes('tracking')) return 'tracking';
        if (path.includes('order')) return 'order';
        if (path.includes('contact')) return 'contact';
        if (path === '/' || path.includes('index')) return 'home';
        return 'other';
    }

    function readJson(key, fallback) {
        try {
            const raw = window.localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw);
        } catch (e) {
            return fallback;
        }
    }

    function writeJson(key, value) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            // Ignore storage failures silently.
        }
    }

    function readCampaignParams() {
        const params = new URLSearchParams(window.location.search);
        const campaign = {
            source: params.get('utm_source') || '',
            medium: params.get('utm_medium') || '',
            name: params.get('utm_campaign') || '',
            term: params.get('utm_term') || '',
            content: params.get('utm_content') || ''
        };
        const hasCampaign = Object.values(campaign).some(Boolean);
        if (hasCampaign) {
            writeJson('crave_analytics_campaign', campaign);
            state.campaign = campaign;
        } else {
            state.campaign = readJson('crave_analytics_campaign', null);
        }
        return state.campaign;
    }

    function applyCampaignParams() {
        const campaign = readCampaignParams();
        if (!campaign) return;
        gtag('set', {
            campaign_source: campaign.source || undefined,
            campaign_medium: campaign.medium || undefined,
            campaign_name: campaign.name || undefined,
            campaign_term: campaign.term || undefined,
            campaign_content: campaign.content || undefined
        });
        if (campaign.source || campaign.medium || campaign.name) {
            track('qr_campaign_detected', {
                utm_source: campaign.source || '',
                utm_medium: campaign.medium || '',
                utm_campaign: campaign.name || '',
                utm_term: campaign.term || '',
                utm_content: campaign.content || ''
            });
        }
    }

    function ensureSession() {
        const sessionKey = 'crave_analytics_session';
        const userKey = 'crave_analytics_user_id';
        const existing = readJson(sessionKey, null);
        const now = Date.now();

        const userId = window.localStorage.getItem(userKey) || ('crave-' + now + '-' + Math.random().toString(36).slice(2, 8));
        window.localStorage.setItem(userKey, userId);

        if (!existing || (now - existing.startedAt) > ONE_DAY) {
            state.sessionId = 'session-' + now + '-' + Math.random().toString(36).slice(2, 8);
            state.sessionStart = now;
            state.sessionPageViews = 0;
            state.isReturningUser = Boolean(existing);
            writeJson(sessionKey, { id: state.sessionId, startedAt: now, pageViews: 0, userId });
        } else {
            state.sessionId = existing.id;
            state.sessionStart = existing.startedAt;
            state.sessionPageViews = existing.pageViews || 0;
            state.isReturningUser = Boolean(existing.userId);
        }

        state.sessionPageViews += 1;
        writeJson(sessionKey, {
            id: state.sessionId,
            startedAt: state.sessionStart,
            pageViews: state.sessionPageViews,
            userId
        });
    }

    function sendPageView() {
        if (state.pageViewSent) return;
        state.pageViewSent = true;
        gtag('config', MEASUREMENT_ID, {
            send_page_view: false,
            page_path: window.location.pathname,
            page_title: document.title,
            page_location: window.location.href
        });
        track('page_view', {
            page_type: getPageType(),
            engagement_time_msec: 1000
        });
    }

    function trackUserEngagement() {
        ensureSession();
        gtag('event', 'user_engagement', {
            session_id: state.sessionId,
            page_type: getPageType(),
            pages_per_session: state.sessionPageViews,
            returning_user: state.isReturningUser ? 'true' : 'false',
            new_user: state.isReturningUser ? 'false' : 'true',
            engagement_time_msec: 1000
        });
        if (state.isReturningUser) {
            track('returning_user', { page_type: getPageType() });
        } else {
            track('new_user', { page_type: getPageType() });
        }
    }

    function getCartItems() {
        const raw = window.localStorage.getItem('craveCart');
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function getCartSummary() {
        const items = getCartItems();
        const itemCount = items.reduce(function (total, item) {
            const qty = Number(item && item.quantity) || 1;
            return total + qty;
        }, 0);
        const value = items.reduce(function (sum, item) {
            const price = Number(item && item.price) || 0;
            const qty = Number(item && item.quantity) || 1;
            return sum + (price * qty);
        }, 0);
        return { items, itemCount, value };
    }

    function updateCartTracking(force) {
        const summary = getCartSummary();
        if (!force && state.lastCartCount === summary.itemCount && state.lastCartValue === summary.value) return;
        state.lastCartCount = summary.itemCount;
        state.lastCartValue = summary.value;
        track('cart_updated', {
            item_count: summary.itemCount,
            cart_value: summary.value,
            page_type: getPageType()
        });
        track('cart_total_changed', {
            item_count: summary.itemCount,
            cart_value: summary.value,
            currency: CURRENCY
        });
        if (summary.itemCount > 0) {
            track('view_cart', {
                item_count: summary.itemCount,
                cart_value: summary.value,
                currency: CURRENCY
            });
        }
    }

    function trackScrollDepth() {
        const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        const percent = docHeight > viewportHeight ? Math.round((scrollTop / (docHeight - viewportHeight)) * 100) : 0;
        const safePercent = Math.min(100, Math.max(0, percent));
        if (safePercent >= 25 && !state.seenScroll.has(25)) {
            state.seenScroll.add(25);
            track('scroll_25', { percent: 25 });
        }
        if (safePercent >= 50 && !state.seenScroll.has(50)) {
            state.seenScroll.add(50);
            track('scroll_50', { percent: 50 });
        }
        if (safePercent >= 75 && !state.seenScroll.has(75)) {
            state.seenScroll.add(75);
            track('scroll_75', { percent: 75 });
        }
        if (safePercent >= 100 && !state.seenScroll.has(100)) {
            state.seenScroll.add(100);
            track('scroll_100', { percent: 100 });
        }
        if (safePercent >= 90 && !state.seenReadingComplete) {
            state.seenReadingComplete = true;
            track('reading_complete', { page_type: getPageType() });
        }
    }

    function trackPerformance() {
        const navigation = window.performance && window.performance.getEntriesByType('navigation')[0];
        const loadTime = navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : 0;
        track('performance_metrics', {
            page_load_time: loadTime,
            page_type: getPageType()
        });

        if (typeof PerformanceObserver !== 'undefined') {
            try {
                const lcpObserver = new PerformanceObserver(function (list) {
                    const entry = list.getEntries().pop();
                    if (entry) {
                        track('lcp', { value: Math.round(entry.startTime) });
                    }
                });
                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
            } catch (e) {}

            try {
                const clsObserver = new PerformanceObserver(function (list) {
                    let clsValue = 0;
                    list.getEntries().forEach(function (entry) {
                        if (entry && entry.hadRecentInput === false) {
                            clsValue += entry.value;
                        }
                    });
                    track('cls', { value: Number(clsValue.toFixed(4)) });
                });
                clsObserver.observe({ type: 'layout-shift', buffered: true });
            } catch (e) {}

            try {
                const fidObserver = new PerformanceObserver(function (list) {
                    const entry = list.getEntries().pop();
                    if (entry) {
                        track('fid', { value: Math.round(entry.processingStart - entry.startTime) });
                    }
                });
                fidObserver.observe({ type: 'first-input', buffered: true });
            } catch (e) {}

            try {
                const inpObserver = new PerformanceObserver(function (list) {
                    const entry = list.getEntries().pop();
                    if (entry) {
                        track('inp', { value: Math.round(entry.processingStart - entry.startTime) });
                    }
                });
                inpObserver.observe({ type: 'event', buffered: true });
            } catch (e) {}
        }
    }

    function trackErrors() {
        window.addEventListener('error', function (event) {
            const target = event.target || {};
            if (target.tagName === 'IMG') {
                track('image_loading_error', { source: target.currentSrc || target.src || '' });
            } else {
                track('javascript_error', {
                    message: event.message || '',
                    filename: event.filename || '',
                    lineno: event.lineno || 0
                });
            }
        }, true);

        window.addEventListener('unhandledrejection', function (event) {
            track('failed_api_call', { message: event.reason && event.reason.message ? event.reason.message : String(event.reason || '') });
        });
    }

    function trackPwa() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js').catch(function () {});
            });
        }

        window.addEventListener('online', function () {
            track('pwa_online', { state: 'online' });
        });
        window.addEventListener('offline', function () {
            track('offline_mode_used', { state: 'offline' });
        });

        window.addEventListener('beforeinstallprompt', function (event) {
            track('install_prompt_dismissed', { event_name: 'beforeinstallprompt' });
            window.deferredPrompt = event;
        });

        window.addEventListener('appinstalled', function () {
            track('pwa_installed', { source: 'browser' });
        });
    }

    function trackNotifications() {
        if (!window.Notification) return;
        const originalRequestPermission = window.Notification.requestPermission;
        if (originalRequestPermission) {
            window.Notification.requestPermission = function () {
                track('notification_permission_requested');
                return originalRequestPermission.apply(this, arguments).then(function (result) {
                    if (result === 'granted') {
                        track('notification_permission_granted');
                    } else if (result === 'denied') {
                        track('notification_permission_denied');
                    }
                    return result;
                });
            };
        }
    }

    function inferLabel(element) {
        if (!element) return '';
        const direct = element.getAttribute && (element.getAttribute('data-analytics-label') || element.getAttribute('aria-label') || element.getAttribute('title'));
        if (direct) return String(direct).trim();
        const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
        if (text) return text;
        const id = element.id || '';
        return id;
    }

    function trackButtonClicks(event) {
        const target = event.target;
        const trigger = target && target.closest ? target.closest('a, button, input[type="button"], input[type="submit"], [role="button"]') : null;
        if (!trigger) return;
        const label = inferLabel(trigger).toLowerCase();
        if (!label) return;
        const href = trigger.getAttribute && trigger.getAttribute('href');
        const buttonName = label.replace(/\s+/g, ' ').trim();
        if (!buttonName) return;

        const relevantWords = [
            'order now', 'explore menu', 'reserve table', 'view cart', 'checkout', 'whatsapp', 'instagram', 'facebook',
            'phone', 'email', 'menu', 'footer', 'search', 'category', 'cart', 'notification', 'install', 'reserve', 'contact'
        ];

        if (!relevantWords.some(function (word) { return buttonName.includes(word); })) {
            return;
        }

        const action = buttonName.includes('whatsapp') ? 'whatsapp' : buttonName.includes('instagram') ? 'instagram' : buttonName.includes('facebook') ? 'facebook' : buttonName.includes('checkout') ? 'checkout' : buttonName.includes('view cart') ? 'view_cart' : buttonName.includes('explore menu') ? 'explore_menu' : buttonName.includes('reserve') ? 'reserve_table' : buttonName.includes('search') ? 'search_button' : buttonName.includes('cart') ? 'cart_button' : buttonName;

        track('button_click', {
            button_name: buttonName,
            button_action: action,
            href: href || '',
            page_type: getPageType()
        });
    }

    function trackMenuInteractions() {
        document.addEventListener('click', function (event) {
            const card = event.target && event.target.closest ? event.target.closest('.bolt-food-item') : null;
            if (card) {
                const itemName = (card.querySelector('.bolt-food-title, .bolt-food-name, .food-name') || {}).textContent || '';
                const itemCategory = card.getAttribute('data-category-id') || getPageType();
                const cardText = (card.textContent || '').toLowerCase();
                if (cardText.includes('popular')) {
                    track('popular_food_clicked', { item_name: itemName, item_category: itemCategory });
                }
                if (cardText.includes('recommended')) {
                    track('recommended_food_clicked', { item_name: itemName, item_category: itemCategory });
                }
                track('food_clicked', {
                    item_name: itemName,
                    item_category: itemCategory,
                    page_type: getPageType()
                });
            }
        }, true);

        const searchInput = document.getElementById('boltMenuSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                const value = searchInput.value.trim();
                state.searchActive = Boolean(value);
                state.searchQuery = value;
                if (value) {
                    track('search_used', { search_term: value, page_type: getPageType() });
                }
            });
        }

        document.addEventListener('click', function (event) {
            const target = event.target && event.target.closest ? event.target.closest('.bolt-category-nav-item') : null;
            if (target) {
                const label = (target.textContent || '').trim();
                track('category_selected', { category_name: label, page_type: getPageType() });
            }
        }, true);
    }

    function wrapFunction(globalName, callback) {
        if (typeof window[globalName] !== 'function') return;
        const original = window[globalName];
        window[globalName] = function () {
            const result = callback.apply(this, arguments);
            return original.apply(this, arguments) || result;
        };
    }

    function patchMenuEvents() {
        if (typeof window.openFoodModal === 'function') {
            const original = window.openFoodModal;
            window.openFoodModal = function (foodName, foodPrice) {
                track('food_card_view', {
                    item_name: foodName || '',
                    item_category: getPageType(),
                    item_variant: 'customization',
                    price: Number(foodPrice) || 0,
                    quantity: 1,
                    currency: CURRENCY
                });
                trackEcommerce('view_item', foodName, getPageType(), 'customization', foodPrice, 1);
                track('food_customization_opened', { item_name: foodName || '', item_category: getPageType() });
                return original.apply(this, arguments);
            };
        }

        if (typeof window.increaseQuantity === 'function') {
            const original = window.increaseQuantity;
            window.increaseQuantity = function () {
                const result = original.apply(this, arguments);
                track('quantity_increased', { page_type: getPageType() });
                return result;
            };
        }

        if (typeof window.decreaseQuantity === 'function') {
            const original = window.decreaseQuantity;
            window.decreaseQuantity = function () {
                const result = original.apply(this, arguments);
                track('quantity_decreased', { page_type: getPageType() });
                return result;
            };
        }

        if (typeof window.toggleRecommendedAddon === 'function') {
            const original = window.toggleRecommendedAddon;
            window.toggleRecommendedAddon = function (addon, index) {
                const result = original.apply(this, arguments);
                const action = addon && addon.name ? 'selected' : 'removed';
                track(action === 'selected' ? 'addon_selected' : 'addon_removed', {
                    addon_name: addon && addon.name ? addon.name : '',
                    page_type: getPageType()
                });
                return result;
            };
        }

        if (typeof window.addToCartWithCustomizations === 'function') {
            const original = window.addToCartWithCustomizations;
            window.addToCartWithCustomizations = function () {
                const result = original.apply(this, arguments);
                const summary = getCartSummary();
                const currentItemName = document.getElementById('modalFoodTitle') ? document.getElementById('modalFoodTitle').textContent : '';
                track('food_customization_completed', { item_name: currentItemName, item_category: getPageType() });
                track('item_added_to_cart', { item_name: currentItemName, item_category: getPageType(), cart_value: summary.value, item_count: summary.itemCount });
                trackEcommerce('add_to_cart', currentItemName, getPageType(), 'customization', summary.value, 1);
                updateCartTracking(true);
                return result;
            };
        }

        if (typeof window.addToCart === 'function') {
            const original = window.addToCart;
            window.addToCart = function (itemName, price) {
                const result = original.apply(this, arguments);
                trackEcommerce('add_to_cart', itemName, getPageType(), 'standard', price, 1);
                track('item_added_to_cart', { item_name: itemName, item_category: getPageType() });
                updateCartTracking(true);
                return result;
            };
        }
    }

    function patchCartEvents() {
        if (typeof window.removeFromCart === 'function') {
            const original = window.removeFromCart;
            window.removeFromCart = function () {
                const before = getCartSummary();
                const result = original.apply(this, arguments);
                const after = getCartSummary();
                track('item_removed_from_cart', { item_count: after.itemCount, cart_value: after.value, previous_value: before.value });
                trackEcommerce('remove_from_cart', '', getPageType(), 'cart', after.value, 1);
                updateCartTracking(true);
                return result;
            };
        }

        const clearCart = document.getElementById('clearCartBtn');
        if (clearCart) {
            clearCart.addEventListener('click', function () {
                track('cart_cleared', { page_type: getPageType() });
            }, true);
        }

        const checkoutButton = document.getElementById('checkoutBtn');
        if (checkoutButton) {
            checkoutButton.addEventListener('click', function () {
                track('checkout_started', { source: 'cart_button', page_type: getPageType() });
                track('begin_checkout', { currency: CURRENCY, value: getCartSummary().value, item_count: getCartSummary().itemCount });
            }, true);
        }

        if (getPageType() === 'cart') {
            track('cart_opened', { item_count: getCartSummary().itemCount, cart_value: getCartSummary().value });
            track('view_cart', { item_count: getCartSummary().itemCount, cart_value: getCartSummary().value, currency: CURRENCY });
        }
    }

    function patchCheckoutEvents() {
        if (typeof window.updateLocation === 'function') {
            const original = window.updateLocation;
            window.updateLocation = function (lat, lng) {
                const result = original.apply(this, arguments);
                track('map_location_selected', { latitude: lat, longitude: lng });
                track('location_confirmed', { latitude: lat, longitude: lng });
                return result;
            };
        }

        const orderTypeRadios = document.querySelectorAll('input[name="orderType"]');
        orderTypeRadios.forEach(function (radio) {
            radio.addEventListener('change', function () {
                if (this.value === 'Delivery') {
                    track('delivery_selected', { page_type: getPageType() });
                } else {
                    track('pickup_selected', { page_type: getPageType() });
                }
            });
        });

        const fullName = document.getElementById('fullName');
        const phone = document.getElementById('phoneNumber');
        if (fullName && phone) {
            [fullName, phone].forEach(function (field) {
                field.addEventListener('input', function () {
                    if (fullName.value && phone.value) {
                        track('customer_information_completed', { page_type: getPageType() });
                    }
                });
            });
        }

        if (typeof window.processOrder === 'function') {
            const original = window.processOrder;
            window.processOrder = function (orderData) {
                track('checkout_started', { source: 'checkout_form', page_type: getPageType() });
                track('begin_checkout', { currency: CURRENCY, value: getCartSummary().value, item_count: getCartSummary().itemCount });
                track('whatsapp_checkout_clicked', { page_type: getPageType() });
                return original.apply(this, arguments);
            };
        }

        if (typeof window.initiatePaystackPayment === 'function') {
            const original = window.initiatePaystackPayment;
            window.initiatePaystackPayment = function () {
                track('payment_page_opened', { currency: CURRENCY, value: getCartSummary().value });
                track('payment_started', { currency: CURRENCY, payment_method: 'paystack', cart_value: getCartSummary().value });
                return original.apply(this, arguments);
            };
        }

        if (typeof window.handlePaymentSuccess === 'function') {
            const original = window.handlePaymentSuccess;
            window.handlePaymentSuccess = function (response, orderData, amount) {
                track('payment_success', { currency: CURRENCY, payment_method: 'paystack', cart_value: amount || getCartSummary().value, payment_reference: (response && response.reference) || '' });
                trackEcommerce('purchase', (orderData && orderData.fullName) || 'Order', getPageType(), 'checkout', amount || getCartSummary().value, 1, { transaction_id: (response && response.reference) || '' });
                return original.apply(this, arguments);
            };
        }

        if (typeof window.showPaymentMessage === 'function') {
            const original = window.showPaymentMessage;
            window.showPaymentMessage = function (message, type) {
                if (type === 'warning' || type === 'error') {
                    track('payment_failed', { currency: CURRENCY, payment_method: 'paystack', message: message || '' });
                }
                return original.apply(this, arguments);
            };
        }
    }

    function bindSessionAndExitTracking() {
        window.addEventListener('beforeunload', function () {
            const summary = getCartSummary();
            if (summary.itemCount > 0) {
                track('cart_abandoned', { item_count: summary.itemCount, cart_value: summary.value, page_type: getPageType() });
            }
            const sessionDuration = Math.round((Date.now() - state.sessionStart) / 1000);
            track('session_duration', {
                session_duration: sessionDuration,
                page_type: getPageType(),
                pages_per_session: state.sessionPageViews
            });
        });
    }

    function init() {
        if (state.initialized) return;
        state.initialized = true;

        applyCampaignParams();
        ensureSession();
        sendPageView();
        trackUserEngagement();
        trackPerformance();
        trackErrors();
        trackPwa();
        trackNotifications();
        trackMenuInteractions();
        patchMenuEvents();
        patchCartEvents();
        patchCheckoutEvents();
        bindSessionAndExitTracking();
        updateCartTracking(true);

        document.addEventListener('click', trackButtonClicks, true);
        window.addEventListener('scroll', trackScrollDepth, { passive: true });
        window.addEventListener('load', function () {
            trackScrollDepth();
            updateCartTracking(true);
        });
        setInterval(function () {
            updateCartTracking(false);
        }, 3000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
