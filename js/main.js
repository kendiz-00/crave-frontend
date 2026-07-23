/**
 * Subtle UI sounds (Web Audio). Skipped when prefers-reduced-motion.
 * Tap: short dual-layer tone — cleaner, slightly louder, app-like “tick”.
 */
const CraveSound = (function () {
  let ctx = null;

  function getCtx() {
    if (typeof window === 'undefined') return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      if (!ctx) ctx = new AC();
    } catch (e) {
      return null;
    }
    return ctx;
  }

  function muted() {
    return (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  function resume(ac) {
    if (ac && ac.state === 'suspended') {
      ac.resume().catch(function () {});
    }
  }

  function playTone(ac, freq, peak, dur, type, startAt) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    const t0 = startAt != null ? startAt : ac.currentTime;
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(ac.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  return {
    tap() {
      const ac = getCtx();
      if (!ac || muted()) return;
      resume(ac);
      const t0 = ac.currentTime;
      playTone(ac, 988, 0.085, 0.042, 'sine', t0);
      playTone(ac, 1568, 0.038, 0.028, 'triangle', t0 + 0.003);
    },
    modalOpen() {
      const ac = getCtx();
      if (!ac || muted()) return;
      resume(ac);
      const t0 = ac.currentTime;
      playTone(ac, 440, 0.042, 0.072, 'triangle', t0);
      playTone(ac, 660, 0.032, 0.055, 'sine', t0 + 0.028);
      if (window.CraveHaptic) window.CraveHaptic.tap();
    },
    success() {
      const ac = getCtx();
      if (!ac || muted()) return;
      resume(ac);
      const t0 = ac.currentTime;
      playTone(ac, 523.25, 0.055, 0.095, 'sine', t0);
      playTone(ac, 783.99, 0.042, 0.12, 'sine', t0 + 0.065);
      if (window.CraveHaptic) window.CraveHaptic.softDouble();
    },
  };
})();
window.CraveSound = CraveSound;

/** Short haptic patterns via navigator.vibrate — skipped when reduced-motion. */
const CraveHaptic = (function () {
  function off() {
    return (
      typeof navigator === 'undefined' ||
      typeof navigator.vibrate !== 'function' ||
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    );
  }

  function pulse(pattern) {
    if (off()) return;
    try {
      navigator.vibrate(pattern);
    } catch (e) {}
  }

  return {
    tap() {
      pulse(12);
    },
    softDouble() {
      pulse([10, 22, 14]);
    },
  };
})();
window.CraveHaptic = CraveHaptic;

function initCravePremiumTactileCapture() {
  document.addEventListener(
    'click',
    function (e) {
      const el = e.target && e.target.closest && e.target.closest(
        '.bolt-floating-cart, #floatingCartBtn, .sticky-cart-hit, a.sticky-cart-hit'
      );
      if (!el) return;
      if (window.CraveHaptic) window.CraveHaptic.tap();
      if (window.CraveSound) window.CraveSound.tap();
    },
    true
  );
}

function initCraveReengagement() {
  const rootId = 'craveReengageRoot';
  const feedId = 'craveReengageFeed';
  const modalId = 'craveReengageExitModal';
  const maxNotifications = 2;
  const inactivityDelay = 25000;
  const prefersReducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let inactivityTimer = null;
  let activityTimer = null;
  let modalOpen = false;

  function readFlag(name) {
    return sessionStorage.getItem(name) === '1';
  }

  function writeFlag(name) {
    sessionStorage.setItem(name, '1');
  }

  function getNotificationCount() {
    return Number(sessionStorage.getItem('craveReengageCount') || '0');
  }

  function incrementNotificationCount() {
    sessionStorage.setItem('craveReengageCount', String(getNotificationCount() + 1));
  }

  function getCartCount() {
    return getCartItemCount(getStoredCart());
  }

  function getCartItems() {
    return Object.values(getStoredCart());
  }

  function getPrimaryCartSummary() {
    const items = getCartItems();
    if (!items.length) return 'Your selections are still ready while the kitchen prepares them.';
    const first = items[0];
    if (items.length === 1) {
      return `${first.quantity} x ${first.title} is still waiting in your cart.`;
    }
    return `${first.title} and ${items.length - 1} other item${items.length > 2 ? 's' : ''} are waiting in your cart.`;
  }

  function getActivityItemName() {
    const cartItems = getCartItems();
    if (cartItems.length) {
      return cartItems[Math.floor(Math.random() * cartItems.length)].title;
    }
    const fallback = ['Grilled Chicken Salad', 'Loaded Fries', 'Artisan Coffee', 'Truffle Pasta', 'Fresh Smoothie', 'Jerk Chicken', 'Red Velvet Cupcake'];
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  // A/B test helpers: assign a sticky group per session and record impressions
  function assignABGroup() {
    const g = Math.random() < 0.5 ? 'A' : 'B';
    sessionStorage.setItem('craveAB_group', g);
    return g;
  }

  function getABGroup() {
    return sessionStorage.getItem('craveAB_group') || assignABGroup();
  }

  function recordImpression(type, variant) {
    try {
      const key = `craveAB_impr_${type}_${variant}`;
      const n = Number(sessionStorage.getItem(key) || '0') + 1;
      sessionStorage.setItem(key, String(n));
      // update debug overlay and dispatch analytics
      try { updateDebugOverlay(); } catch (e) {}
      try { enqueueAnalytics({ type: type, variant: variant, count: n, ts: Date.now() }); } catch (e) {}
    } catch (e) {}
  }

  function getImpressionCount(type, variant) {
    return Number(sessionStorage.getItem(`craveAB_impr_${type}_${variant}`) || '0');
  }

  function createContainers() {
    if (document.getElementById(rootId)) return;

    const root = document.createElement('div');
    root.id = rootId;
    root.className = 'crave-reengage-root';
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-atomic', 'false');
    document.body.appendChild(root);

    const feed = document.createElement('div');
    feed.id = feedId;
    feed.className = 'crave-reengage-feed';
    feed.setAttribute('aria-live', 'polite');
    feed.setAttribute('aria-atomic', 'false');
    document.body.appendChild(feed);

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'crave-reengage-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="crave-reengage-modal__backdrop"></div>
      <div class="crave-reengage-modal__panel" role="dialog" aria-modal="true" aria-labelledby="${modalId}-title">
        <button type="button" class="crave-reengage-modal__close" aria-label="Close notification">×</button>
        <p class="crave-reengage-modal__eyebrow">Before you go...</p>
        <h2 id="${modalId}-title" class="crave-reengage-modal__title">Your order is ready to continue.</h2>
        <p class="crave-reengage-modal__text">We’re keeping your selected dishes warm while the kitchen finalizes the next service wave.</p>
        <div class="crave-reengage-modal__actions">
          <button type="button" class="crave-reengage-modal__btn" data-action="openCart">View cart</button>
          <button type="button" class="crave-reengage-modal__btn crave-reengage-modal__btn--secondary" data-action="stay">Keep browsing</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    // create debug overlay if requested
    if (localStorage.getItem('craveReengage_debug') === '1') createDebugOverlay();
  }

  /* Debug overlay and analytics export */
  function createDebugOverlay() {
    if (document.getElementById('craveReengageDebug')) return;
    const o = document.createElement('aside');
    o.id = 'craveReengageDebug';
    o.className = 'crave-reengage-debug';
    o.setAttribute('aria-hidden', 'true');
    o.innerHTML = `
      <div class="crave-reengage-debug__inner">
        <header class="crave-reengage-debug__hdr">Crave Reengage — Debug</header>
        <div class="crave-reengage-debug__body">
          <div>Group: <span id="craveReengageDebug_group">-</span></div>
          <div>Social A: <span id="craveReengageDebug_social_A">0</span></div>
          <div>Social B: <span id="craveReengageDebug_social_B">0</span></div>
          <div>Feed A: <span id="craveReengageDebug_feed_A">0</span></div>
          <div>Feed B: <span id="craveReengageDebug_feed_B">0</span></div>
          <div>Notifs shown: <span id="craveReengageDebug_notifs">0</span></div>
        </div>
        <div class="crave-reengage-debug__footer"><button id="craveReengageDebug_close">Close</button></div>
      </div>
    `;
    document.body.appendChild(o);
    document.getElementById('craveReengageDebug_close').addEventListener('click', function() {
      o.style.display = 'none';
      localStorage.removeItem('craveReengage_debug');
    });
    updateDebugOverlay();
  }

  function updateDebugOverlay() {
    const g = getABGroup();
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v); };
    set('craveReengageDebug_group', g);
    set('craveReengageDebug_social_A', getImpressionCount('social','A'));
    set('craveReengageDebug_social_B', getImpressionCount('social','B'));
    set('craveReengageDebug_feed_A', getImpressionCount('feed','A'));
    set('craveReengageDebug_feed_B', getImpressionCount('feed','B'));
    set('craveReengageDebug_notifs', getNotificationCount());
  }

  function sendAnalytics(type, variant, count) {
    // Deprecated: batching is used via enqueueAnalytics/flushAnalytics
    try {
      const payload = { event: 'crave_reengage_impression', type, variant, count, group: getABGroup(), path: window.location.pathname, ts: Date.now() };
      if (window.console && window.console.log) console.log('sendAnalytics (legacy):', payload);
    } catch (e) {}
  }

  // Analytics queue + flush
  const _analyticsQueue = [];
  function enqueueAnalytics(evt) {
    try {
      _analyticsQueue.push(evt);
      // persist small queue to sessionStorage for resilience (trim to last 50)
      try {
        const copy = _analyticsQueue.slice(-50);
        sessionStorage.setItem('craveAB_queue', JSON.stringify(copy));
      } catch (e) {}
    } catch (e) {}
  }

  function flushAnalytics() {
    try {
      const cfg = window.CraveReengageConfig || {};
      const url = cfg.analyticsUrl || (document.querySelector('meta[name="crave-analytics-url"]') || {}).content;
      if (!url) return;
      // Rehydrate persisted queue
      try {
        const stored = JSON.parse(sessionStorage.getItem('craveAB_queue') || '[]');
        if (stored && stored.length) {
          // merge into _analyticsQueue start
          stored.forEach(s => _analyticsQueue.unshift(s));
        }
      } catch (e) {}
      if (_analyticsQueue.length === 0) return;
      const batch = _analyticsQueue.splice(0, 50);
      // clear persisted copy
      try { sessionStorage.removeItem('craveAB_queue'); } catch (e) {}
      const payload = { event: 'crave_reengage_batch', items: batch, path: window.location.pathname, ts: Date.now() };
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        try {
          const blob = new Blob([body], { type: 'application/json' });
          navigator.sendBeacon(url, blob);
          return;
        } catch (e) {}
      }
      // fallback fetch
      fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(function(){});
    } catch (e) {}
  }

  // periodic flush and unload flush
  let _analyticsFlushInterval = null;
  function startAnalyticsFlushInterval() {
    if (_analyticsFlushInterval) return;
    _analyticsFlushInterval = window.setInterval(flushAnalytics, 10000);
    window.addEventListener('beforeunload', function() {
      try {
        // attempt final flush via sendBeacon synchronously
        const cfg = window.CraveReengageConfig || {};
        const url = cfg.analyticsUrl || (document.querySelector('meta[name="crave-analytics-url"]') || {}).content;
        if (!url) return;
        const stored = JSON.parse(sessionStorage.getItem('craveAB_queue') || '[]');
        const all = _analyticsQueue.concat(stored);
        if (!all || all.length === 0) return;
        const payload = { event: 'crave_reengage_batch', items: all, path: window.location.pathname, ts: Date.now() };
        const body = JSON.stringify(payload);
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: 'application/json' });
          navigator.sendBeacon(url, blob);
        }
      } catch (e) {}
    });
  }

  // Toggle debug overlay with Ctrl+Shift+D
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.shiftKey && e.key && e.key.toLowerCase() === 'd') {
      if (localStorage.getItem('craveReengage_debug') === '1') {
        localStorage.removeItem('craveReengage_debug');
        const el = document.getElementById('craveReengageDebug'); if (el) el.style.display = 'none';
      } else {
        localStorage.setItem('craveReengage_debug', '1');
        createDebugOverlay();
      }
    }
  }, false);

  function closeModal() {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modalOpen = false;
    resetInactivityTimer();
  }

  function openModal() {
    const modal = document.getElementById(modalId);
    if (!modal || modalOpen) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    modalOpen = true;
    if (window.CraveSound) window.CraveSound.modalOpen();
    writeFlag('craveReengageExitShown');
  }

  function showMessageCard({ title, body, badge, actionText, actionType }) {
    if (getNotificationCount() >= maxNotifications) return;
    const root = document.getElementById(rootId);
    if (!root) return;

    const card = document.createElement('article');
    card.className = 'crave-reengage-card';
    card.innerHTML = `
      <div class="crave-reengage-card__header">
        <span class="crave-reengage-card__badge">${badge || 'Live update'}</span>
      </div>
      <div class="crave-reengage-card__body">
        <strong class="crave-reengage-card__title">${title}</strong>
        <p class="crave-reengage-card__text">${body}</p>
      </div>
      ${actionText ? `<div class="crave-reengage-card__action"><button type="button" class="crave-reengage-card__button" data-action="${actionType}">${actionText}</button></div>` : ''}
    `;

    root.appendChild(card);
    window.requestAnimationFrame(() => card.classList.add('is-visible'));
    incrementNotificationCount();
    if (window.CraveSound) window.CraveSound.tap();
    if (window.CraveHaptic) window.CraveHaptic.softDouble();

    const timeout = prefersReducedMotion ? 4500 : 5200;
    window.setTimeout(() => {
      card.classList.remove('is-visible');
      window.setTimeout(() => {
        if (card.parentNode) card.parentNode.removeChild(card);
      }, 320);
    }, timeout);
  }

  function showActivityFeed(text) {
    const feed = document.getElementById(feedId);
    if (!feed) return;

    const item = document.createElement('div');
    item.className = 'crave-reengage-feed__item';
    item.textContent = text;
    feed.appendChild(item);
    window.requestAnimationFrame(() => item.classList.add('is-visible'));

    window.setTimeout(() => {
      item.classList.remove('is-visible');
      window.setTimeout(() => {
        if (item.parentNode) item.parentNode.removeChild(item);
      }, 200);
    }, 5200);
  }

  function showInactivityNotification() {
    if (getCartCount() === 0) return;
    showMessageCard({
      title: 'Your order is waiting',
      body: getPrimaryCartSummary(),
      badge: 'Ready',
      actionText: 'View cart',
      actionType: 'openCart'
    });
  }

  function showSocialProofNotification() {
    if (getCartCount() === 0) return;
    const itemName = getActivityItemName();
    const safeName = itemName || getActivityItemName();
    const customerCount = Math.floor(Math.random() * 3) + 2;

    const group = getABGroup();
    // Variant A: conversational templates. Variant B: emoji + urgency CTA.
    const templatesA = [
      `Just now, ${customerCount} customers nearby added ${safeName} — looks tasty!`,
      `Hot now: ${safeName} was added by ${customerCount} customers nearby.`,
      `Loved by locals: ${customerCount} nearby added ${safeName} to their orders.`,
      `${customerCount} people just added ${safeName} — grab yours while it's fresh!`
    ];
    const templatesB = [
      `🔥 ${safeName} was just added by ${customerCount} nearby — trending now!`,
      `⏳ ${customerCount} customers grabbed ${safeName} just now — limited plates left.`,
      `⭐ ${safeName} is hot — ${customerCount} nearby added it to their orders.`
    ];

    const pool = group === 'B' ? templatesB : templatesA;
    const template = pool[Math.floor(Math.random() * pool.length)];

    // Record impression for this AB group
    recordImpression('social', group);

    showMessageCard({
      title: 'Live order update',
      body: template,
      badge: 'Live',
      actionText: group === 'B' ? 'Order now' : 'View menu',
      actionType: 'dismiss'
    });
  }

  function scheduleInactivityTimer() {
    if (inactivityTimer) {
      window.clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
    if (getCartCount() === 0 || getNotificationCount() >= maxNotifications || modalOpen) return;
    inactivityTimer = window.setTimeout(() => {
      if (getCartCount() > 0 && !modalOpen) {
        showInactivityNotification();
        scheduleActivityCycle();
      }
    }, inactivityDelay);
  }

  function resetInactivityTimer() {
    scheduleInactivityTimer();
  }

  function scheduleActivityCycle() {
    if (activityTimer) {
      window.clearTimeout(activityTimer);
    }
    if (getCartCount() === 0) return;
    activityTimer = window.setTimeout(() => {
      if (getCartCount() === 0) return;
      const activityName = getActivityItemName();
      const feedVariants = [
        `A customer added ${activityName} to their order.`,
        `${activityName} just got added to an order.`,
        `Someone nearby chose ${activityName}.`
      ];
      const group = getABGroup();
      // Record feed impression per AB group
      recordImpression('feed', group);
      showActivityFeed(feedVariants[Math.floor(Math.random() * feedVariants.length)]);
      if (getNotificationCount() < maxNotifications) {
        showSocialProofNotification();
      }
      scheduleActivityCycle();
    }, 12000 + Math.round(Math.random() * 9000));
  }

  function handleInteraction() {
    if (modalOpen) return;
    resetInactivityTimer();
  }

  function handleExitIntent(event) {
    if (event.clientY <= 0 && getCartCount() > 0 && !readFlag('craveReengageExitShown') && !modalOpen) {
      openModal();
    }
  }

  function handleModalAction(event) {
    const action = event.target.dataset.action;
    if (!action) return;
    if (action === 'openCart') {
      window.location.href = 'cart.html';
      return;
    }
    if (action === 'stay' || action === 'dismiss') {
      closeModal();
    }
  }

  function handleModalKeydown(event) {
    if (event.key === 'Escape' && modalOpen) {
      closeModal();
    }
  }

  function handleModalClick(event) {
    if (event.target.id === modalId || event.target.classList.contains('crave-reengage-modal__backdrop')) {
      closeModal();
    }
  }

  function showReturnVisitorMessage() {
    const lastVisit = Number(localStorage.getItem('craveLastVisit'));
    const now = Date.now();
    if (lastVisit && !readFlag('craveReengageReturnShown')) {
      const daysSince = Math.max(1, Math.round((now - lastVisit) / 86400000));
      const bodyText = daysSince === 1
        ? 'Glad to see you again today. Your favorites are still close by.'
        : `Welcome back — it’s been ${daysSince} day${daysSince > 1 ? 's' : ''}. Your menu awaits.`;
      showMessageCard({
        title: 'Welcome back',
        body: bodyText,
        badge: 'Welcome',
        actionText: 'Continue',
        actionType: 'dismiss'
      });
      writeFlag('craveReengageReturnShown');
    }
    localStorage.setItem('craveLastVisit', String(now));
  }

  function init() {
    createContainers();
    document.addEventListener('click', handleInteraction, { passive: true });
    document.addEventListener('keydown', handleInteraction, { passive: true });
    document.addEventListener('scroll', handleInteraction, { passive: true });
    document.addEventListener('touchstart', handleInteraction, { passive: true });
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        resetInactivityTimer();
      }
    });
    document.addEventListener('mouseout', handleExitIntent);
    document.addEventListener('keydown', handleModalKeydown);
    const root = document.getElementById(rootId);
    if (root) {
      root.addEventListener('click', handleModalAction);
    }
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.addEventListener('click', handleModalClick);
    }
    showReturnVisitorMessage();
    scheduleInactivityTimer();
    scheduleActivityCycle();
    // start analytics flush interval
    startAnalyticsFlushInterval();
  }

  init();
}

function initCravePwaLayer() {
  if (typeof window === 'undefined') return;

  const appShell = {
    installPromptEvent: null,
    installCardDismissed: false,
    init() {
      this.ensureInstallUi();
      this.registerServiceWorker();
      this.bindInstallPrompt();
      this.bindOfflineEvents();
      this.bindBackgroundSync();
      this.bindNotificationControls();
      this.bindBadge();
      this.showInstallCard();
      this.restoreReturnVisitorState();
    },
    registerServiceWorker() {
      if (!('serviceWorker' in navigator)) return;
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          if (registration.waiting) {
            this.showUpdateToast(registration);
          }
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateToast(registration);
              }
            });
          });
        }).catch(() => {});
      });
    },
    bindInstallPrompt() {
      window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault();
        this.installPromptEvent = event;
        this.showInstallCard();
      });
      window.addEventListener('appinstalled', () => {
        this.hideInstallCard();
      });
    },
    bindOfflineEvents() {
      const setOfflineState = () => {
        document.body.classList.add('crave-offline');
        document.documentElement.classList.add('crave-offline');
      };
      const setOnlineState = () => {
        document.body.classList.remove('crave-offline');
        document.documentElement.classList.remove('crave-offline');
      };
      window.addEventListener('offline', setOfflineState);
      window.addEventListener('online', () => {
        setOnlineState();
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
          navigator.serviceWorker.ready.then(registration => {
            if (registration.sync && registration.sync.getTags) {
              registration.sync.getTags().then(tags => {
                if (tags.includes('crave-sync')) registration.sync.register('crave-sync');
              });
            }
          });
        }
      });
      if (!navigator.onLine) setOfflineState();
    },
    bindBackgroundSync() {
      if (!('serviceWorker' in navigator) || !navigator.serviceWorker.ready) return;
      navigator.serviceWorker.ready.then(registration => {
        if (registration.sync && registration.sync.register) {
          registration.sync.register('crave-sync').catch(() => {});
        }
      });
    },
    bindNotificationControls() {
      if (typeof Notification === 'undefined') return;
      const permission = Notification.permission;
      const button = document.getElementById('craveNotifyBtn');
      if (button) {
        button.addEventListener('click', () => this.requestNotificationPermission());
        if (permission === 'granted') {
          button.textContent = 'Notifications on';
          button.setAttribute('aria-pressed', 'true');
        }
      }
    },
    requestNotificationPermission() {
      if (typeof Notification === 'undefined') return;
      Notification.requestPermission().then(result => {
        if (result === 'granted') {
          this.showNotification('CRAVE is ready', 'You will receive thoughtful order and menu reminders.', { tag: 'crave-welcome' });
          this.updateBadge('1');
        }
      });
    },
    showNotification(title, body, options) {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const pathParts = window.location.pathname.split('/');
      pathParts[pathParts.length - 1] = 'index.html';
      const repoIndex = pathParts.join('/');
      const data = Object.assign({ url: repoIndex }, options && options.data ? options.data : {});
      const payload = Object.assign({
        body,
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        tag: 'crave-notification',
        data,
        vibrate: [120, 60, 120]
      }, options || {});
      new Notification(title, payload);
    },
    bindBadge() {
      if (!('setAppBadge' in navigator)) return;
      const cartCount = this.getCartCount();
      if (cartCount > 0) {
        navigator.setAppBadge(cartCount).catch(() => {});
      } else {
        navigator.clearAppBadge().catch(() => {});
      }
    },
    updateBadge(count) {
      if (!('setAppBadge' in navigator)) return;
      if (count) {
        navigator.setAppBadge(Number(count)).catch(() => {});
      } else {
        navigator.clearAppBadge().catch(() => {});
      }
    },
    getCartCount() {
      try {
        const cart = JSON.parse(localStorage.getItem('craveCart') || '{}');
        return Object.values(cart).reduce((total, item) => total + (item.quantity || 0), 0);
      } catch (e) {
        return 0;
      }
    },
    ensureInstallUi() {
      if (document.getElementById('craveInstallCard') && document.getElementById('craveUpdateToast')) return;
      const installCard = document.createElement('div');
      installCard.id = 'craveInstallCard';
      installCard.className = 'crave-install-card';
      installCard.setAttribute('role', 'status');
      installCard.setAttribute('aria-live', 'polite');
      installCard.innerHTML = `
        <div class="crave-install-card__content">
          <p class="crave-install-card__eyebrow">Install CRAVE</p>
          <h2>Open the app faster with a polished home-screen experience.</h2>
          <p>Keep your cart, enjoy quicker reorders, and launch CRAVE like a native app.</p>
          <div class="crave-install-card__actions">
            <button id="craveInstallBtn" class="crave-install-card__button" type="button">Install app</button>
            <button id="craveNotifyBtn" class="crave-install-card__secondary" type="button">Enable reminders</button>
            <button id="craveInstallDismiss" class="crave-install-card__dismiss" type="button" aria-label="Dismiss install prompt">Not now</button>
          </div>
        </div>
      `;
      const updateToast = document.createElement('div');
      updateToast.id = 'craveUpdateToast';
      updateToast.className = 'crave-update-toast';
      updateToast.setAttribute('role', 'status');
      updateToast.setAttribute('aria-live', 'polite');
      updateToast.innerHTML = `
        <span>A fresh CRAVE update is ready.</span>
        <button id="craveRefreshApp" type="button">Refresh</button>
      `;
      document.body.appendChild(installCard);
      document.body.appendChild(updateToast);
    },
    showInstallCard() {
      if (this.installCardDismissed || !this.installPromptEvent) return;
      const card = document.getElementById('craveInstallCard');
      if (!card) return;
      card.classList.add('is-visible');
      const button = document.getElementById('craveInstallBtn');
      if (button) {
        button.addEventListener('click', () => {
          this.installPromptEvent.prompt();
          this.installPromptEvent = null;
          this.hideInstallCard();
        });
      }
      const dismiss = document.getElementById('craveInstallDismiss');
      if (dismiss) {
        dismiss.addEventListener('click', () => {
          this.installCardDismissed = true;
          this.hideInstallCard();
        });
      }
    },
    hideInstallCard() {
      const card = document.getElementById('craveInstallCard');
      if (card) card.classList.remove('is-visible');
    },
    showUpdateToast(registration) {
      const toast = document.getElementById('craveUpdateToast');
      if (!toast) return;
      toast.classList.add('is-visible');
      const refreshButton = document.getElementById('craveRefreshApp');
      if (refreshButton) {
        refreshButton.addEventListener('click', () => {
          if (registration && registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }, { once: true });
      }
    },
    restoreReturnVisitorState() {
      const lastVisit = Number(localStorage.getItem('craveLastVisit') || '0');
      const now = Date.now();
      if (lastVisit && now - lastVisit > 86400000) {
        this.showNotification('Welcome back to CRAVE', 'Your favorites and cart are still here.', { tag: 'crave-return' });
      }
      localStorage.setItem('craveLastVisit', String(now));
    }
  };

  appShell.init();
  window.CravePwa = appShell;
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize authentication system
  if (typeof AuthManager !== 'undefined') {
    AuthManager.initialize();
  }
  if (typeof AuthUI !== 'undefined') {
    AuthUI.initialize();
  }

  initCravePremiumTactileCapture();
  initCravePwaLayer();
  // Navbar toggle and sticky behavior
  initNavbarBehavior();
  
  // Sidebar toggle
  initSidebar();
  
  // Smooth scrolling
  initSmoothScroll();
  
  // Form handlers
  initForms();
  
  // Animations
  initAnimations();
  
  // Menu filtering
  initMenuFilter();
  
  // Initialize menu cards generation
  initMenuCards();
  
  // SIMPLE WORKING CART SYSTEM
  initSimpleCart();
  initCraveReengagement();
  
  // Initialize menu category scroll
  initMenuCategoryScroll();
  
  // Initialize reservation form
  initReservationForm();
  
  // SAFE: Floating Cart Button Functionality
  const floatingCartBtn = document.getElementById('floatingCartBtn');
  const cartBadge = document.getElementById('cartBadge');
  
  if (floatingCartBtn) {
    floatingCartBtn.addEventListener('click', function() {
      window.location.href = 'cart.html';
    });
  }
  
  // SAFE: Update cart badge function
  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('craveCart')) || {};
    const itemCount = Object.values(cart).reduce((total, item) => total + item.quantity, 0);
    
    // Update floating cart badge
    if (cartBadge) {
      cartBadge.textContent = itemCount;
      cartBadge.style.display = itemCount > 0 ? 'block' : 'none';
    }
    
    // Update mini cart text
    const miniCartText = document.getElementById('miniCartText');
    if (miniCartText) {
      miniCartText.textContent = itemCount === 0 ? '0 items' : `${itemCount} item${itemCount !== 1 ? 's' : ''}`;
    }

    if (window.CravePwa) {
      window.CravePwa.updateBadge(itemCount);
    }
  }
  
  // Update badge on page load
  updateCartBadge();
  
  // SAFE: Override original updateCartSummary to also update badge
  const originalUpdateCartSummary = updateCartSummary;
  updateCartSummary = function() {
    originalUpdateCartSummary();
    updateCartBadge();
  };
});

/**
 * Navbar: active link + scroll shadow (no mobile drawer — links always visible).
 */
function initNavbarBehavior() {
  const navbarMenu = document.getElementById('navbarMenu');
  const navbarHeader = document.getElementById('siteHeader') || document.querySelector('.navbar-header');
  const navbarLinks = document.querySelectorAll('.navbar-link');

  if (navbarMenu) {
    navbarMenu.setAttribute('aria-hidden', 'false');
  }

  navbarLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (window.CraveHaptic) window.CraveHaptic.tap();
    });
  });

  const path = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';
  const pageName = path === '' ? 'index.html' : path;

  navbarLinks.forEach(link => {
    const target = link.getAttribute('data-page');
    link.classList.remove('active');

    if ((target === 'home' && (pageName === 'index.html' || pageName === '')) ||
        (target && pageName === `${target}.html`)) {
      link.classList.add('active');
    }
  });

  function updateHeaderShadow() {
    if (!navbarHeader) return;
    const hasShadow = window.scrollY > 8;
    navbarHeader.classList.toggle('scrolled', hasShadow);
  }

  window.addEventListener('scroll', updateHeaderShadow, { passive: true });
  updateHeaderShadow();
}



/**
 * Initialize Sidebar Toggle
 */
function initSidebar() {
  const showBtn = document.querySelector('.btn-show-sidebar');
  const hideBtn = document.querySelector('.btn-hide-sidebar');
  const sidebar = document.querySelector('.sidebar');
  
  if (showBtn && sidebar) {
    showBtn.addEventListener('click', function() {
      sidebar.classList.add('show');
    });
  }
  
  if (hideBtn && sidebar) {
    hideBtn.addEventListener('click', function() {
      sidebar.classList.remove('show');
    });
  }
  
  // Close sidebar when clicking on a link
  const sidebarLinks = document.querySelectorAll('.sidebar a');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (sidebar) sidebar.classList.remove('show');
    });
  });
}

/**
 * Smooth Scroll
 */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Smooth scroll when landing on a page with a hash (e.g., menu.html#smoothies)
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }
}

/**
 * Initialize Forms
 */
function initForms() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      // Prevent default if no action
      if (!this.action) {
        e.preventDefault();
        alert('Thank you! Your message has been received.');
        this.reset();
      }
    });
  });
}

/**
 * Initialize Animations
 */
function initAnimations() {
  const elements = document.querySelectorAll('.animated.visible-false');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const animationType = entry.target.getAttribute('data-appear');
        if (animationType) {
          entry.target.classList.add(animationType);
        }
        entry.target.classList.remove('visible-false');
        observer.unobserve(entry.target);
      }
    });
  });
  
  elements.forEach(el => observer.observe(el));
}



/**
 * Initialize Menu Category Section Scroll Detection - Enhanced
 */
function initMenuCategoryScroll() {
  const stickyNav = document.querySelector('.menu-sticky-nav');
  const navLinks = document.querySelectorAll('.sticky-nav-link');
  const sections = document.querySelectorAll('.menu-category-section');
  
  if (navLinks.length === 0 || sections.length === 0) return;
  
  // Get navbar height for accurate offset calculation
  const navbar = document.querySelector('.navbar-header');
  const navbarHeight = navbar ? navbar.offsetHeight : 64;
  const stickyNavHeight = stickyNav ? stickyNav.offsetHeight : 60;
  const totalOffset = navbarHeight + stickyNavHeight + 20; // 20px extra buffer
  
  // Throttle function for better performance
  let ticking = false;
  function updateActiveCategory() {
    let current = '';
    let scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - totalOffset;
      const sectionBottom = sectionTop + section.offsetHeight;
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
        current = section.getAttribute('id');
      }
    });
    
    // Handle case when scrolling above first section
    if (scrollPosition < sections[0].offsetTop - totalOffset) {
      current = sections[0].getAttribute('id');
    }
    
    // Handle case when scrolling past last section
    if (scrollPosition >= sections[sections.length - 1].offsetTop + sections[sections.length - 1].offsetHeight - totalOffset) {
      current = sections[sections.length - 1].getAttribute('id');
    }
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-section') === current) {
        link.classList.add('active');
        
        // Scroll the sticky nav to show the active link
        const container = link.parentElement;
        const linkLeft = link.offsetLeft;
        const linkWidth = link.offsetWidth;
        const containerWidth = container.offsetWidth;
        const containerScrollLeft = container.scrollLeft;
        
        if (linkLeft < containerScrollLeft) {
          container.scrollLeft = linkLeft - 10;
        } else if (linkLeft + linkWidth > containerScrollLeft + containerWidth) {
          container.scrollLeft = linkLeft + linkWidth - containerWidth + 10;
        }
      }
    });
    
    ticking = false;
  }
  
  // Initial update
  updateActiveCategory();
  
  // Scroll event listener with throttling
  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(updateActiveCategory);
      ticking = true;
    }
  }, { passive: true });
  
  // Click event for smooth scrolling
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = link.getAttribute('data-section');
      const targetSection = document.getElementById(targetId);
      
      if (targetSection) {
        const targetPosition = targetSection.offsetTop - totalOffset + 1;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

function initMenuFilter() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const menuItems = document.querySelectorAll('.menu-item');
  
  if (filterButtons.length === 0 || menuItems.length === 0) return;
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      this.classList.add('active');
      
      const filterValue = this.getAttribute('data-filter');
      
      // Filter menu items
      menuItems.forEach(item => {
        const category = item.getAttribute('data-category');
        
        if (filterValue === 'popular' || category === filterValue) {
          item.classList.remove('hide');
        } else {
          item.classList.add('hide');
        }
      });
    });
  });
}

/**
 * Initialize Menu Cards Generation (reusable template)
 */
function initMenuCards() {
  // Only run on menu.html
  if (!window.location.pathname.includes('menu.html')) return;

  const menuData = {
    'most-popular': [
      { img: 'images/meat.jpeg', alt: 'Grilled Chicken Salad', title: 'Grilled Chicken Salad', desc: 'Grilled chicken breast over mixed greens with balsamic vinaigrette', price: '$15.99', badge: '🔥 Popular' },
      { img: 'images/smoothies.jpeg', alt: 'Fresh Smoothie', title: 'Fresh Smoothie', desc: 'Blend of seasonal fruits with yogurt and honey', price: '$6.99', badge: 'Best Seller' },
      { img: 'images/chick.jpeg', alt: 'Artisan Coffee', title: 'Artisan Coffee', desc: 'Single-origin coffee beans roasted in-house', price: '$4.99', badge: 'Popular' }
    ],
    'loaded-fries': [
      { img: 'images/tx-chick.jpeg', alt: 'Avocado Toast', title: 'Avocado Toast', desc: 'Fresh avocado on artisanal bread with poached eggs and cherry tomatoes', price: '$12.99', badge: '🔥 Popular' },
      { img: 'images/waffles.jpg', alt: 'Fluffy Pancakes', title: 'Fluffy Pancakes', desc: 'Light and fluffy pancakes served with maple syrup and fresh berries', price: '$9.99' }
    ],
    'texas-chicken': [
      { img: 'images/meat.jpeg', alt: 'Grilled Chicken Salad', title: 'Grilled Chicken Salad', desc: 'Grilled chicken breast over mixed greens with balsamic vinaigrette', price: '$15.99', badge: '🔥 Popular' },
      { img: 'images/wrap-01.jpeg', alt: 'Turkey Club Wrap', title: 'Turkey Club Wrap', desc: 'Sliced turkey, bacon, lettuce, and tomato in a whole wheat wrap', price: '$11.99' }
    ],
    'smoothies': [
      { img: 'images/oxtail.jpeg', alt: 'Grilled Ribeye Steak', title: 'Grilled Ribeye Steak', desc: '8oz ribeye steak grilled to perfection with garlic mashed potatoes', price: '$28.99', badge: '🔥 Popular' },
      { img: 'images/inside.jpeg', alt: 'Truffle Pasta', title: 'Truffle Pasta', desc: 'House-made pasta with black truffle oil, parmesan, and fresh herbs', price: '$22.99' }
    ],
    'milkshakes': [
      { img: 'images/smoothies.jpeg', alt: 'Fresh Smoothie', title: 'Fresh Smoothie', desc: 'Blend of seasonal fruits with yogurt and honey', price: '$6.99' },
      { img: 'images/chick.jpeg', alt: 'Artisan Coffee', title: 'Artisan Coffee', desc: 'Single-origin coffee beans roasted in-house', price: '$4.99', badge: 'Popular' }
    ],
    'jamaican-kitchen': [
      { img: 'images/jamaican.jpeg', alt: 'Jerk Chicken', title: 'Jerk Chicken', desc: 'Spicy marinated chicken with traditional Jamaican spices', price: '$16.99', badge: '🔥 Popular' }
    ],
    'cupcakes': [
      { img: 'images/cupcake.jpeg', alt: 'Red Velvet Cupcake', title: 'Red Velvet Cupcake', desc: 'Classic red velvet with cream cheese frosting', price: '$4.50' }
    ],
    'cake-and-shakes': [
      { img: 'images/cake.jpg', alt: 'Chocolate Cake', title: 'Chocolate Cake', desc: 'Rich chocolate cake with vanilla ice cream', price: '$7.99' }
    ]
  };

  function createMenuCard(item) {
    const badgeHtml = item.badge ? `<div class="menu-badge">${item.badge}</div>` : '';
    return `
      <div class="menu-item" data-category="${item.category || 'popular'}">
        <div class="menu-card">
          <div class="menu-image">
            <img src="${item.img}" alt="${item.alt}" loading="lazy" onerror="this.src='images/logo.png'">
            ${badgeHtml}
          </div>
          <div class="menu-content">
            <h4 class="menu-title">${item.title}</h4>
            <p class="menu-description">${item.desc}</p>
            <div class="menu-price">${item.price}</div>
            <div class="qty-controls">
              <button class="qty-btn" data-action="decrease" data-item="${item.title}" type="button">-</button>
              <input class="qty-input" type="number" min="1" value="1" data-item="${item.title}" />
              <button class="qty-btn" data-action="increase" data-item="${item.title}" type="button">+</button>
            </div>
            <button class="btn-add-cart" data-item="${item.title}" data-price="${item.price}">Add to Cart</button>
            <button class="btn-order" data-item="${item.title}">Order This Item</button>
          </div>
        </div>
      </div>
    `;
  }

  Object.keys(menuData).forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section) {
      const grid = section.querySelector('.menu-grid');
      if (grid) {
        grid.innerHTML = menuData[sectionId].map(createMenuCard).join('');
      }
    }
  });
}

/**
 * Initialize WhatsApp Order Integration
 */
function initWhatsAppOrders() {
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('btn-order')) {
      event.preventDefault();
      const itemName = event.target.getAttribute('data-item');
      const phoneNumber = '233550020788';
      const message = `Hi Crave, I'd like to order ${itemName}`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    }
  });
}

/**
 * SIMPLE WORKING CART SYSTEM - REMOVED
 * Cart logic is now handled in menu.html with array-based structure
 */

function getItemKey(itemTitle) {
  return itemTitle.trim().toLowerCase().replace(/\s+/g, '-');
}

function parsePrice(value) {
  const number = parseFloat(value.replace(/[^0-9.]/g, ''));
  return Number.isNaN(number) ? 0 : number;
}

function getStoredCart() {
  return JSON.parse(localStorage.getItem('craveCart')) || {};
}

function setStoredCart(cart) {
  localStorage.setItem('craveCart', JSON.stringify(cart));
}

function getCartItemCount(cart) {
  return Object.values(cart || {}).reduce((total, item) => total + (item.quantity || 0), 0);
}

function updateCartSummary() {
  const cart = getStoredCart();
  const orderCount = getCartItemCount(cart);
  const orderSummary = document.getElementById('orderCount');
  if (orderSummary) {
    orderSummary.textContent = orderCount > 0 ? `Cart: ${orderCount} item${orderCount > 1 ? 's' : ''}` : 'Cart is empty';
  }
}

function clearCart() {
  const cart = getStoredCart();
  Object.keys(cart).forEach(key => delete cart[key]);
  setStoredCart(cart);
  updateCartSummary();
}

function buildWhatsAppCartMessage() {
  const cart = getStoredCart();
  const lines = Object.values(cart).map(item => `${item.quantity} x ${item.title} (${item.price})`);
  if (lines.length === 0) return '';
  return `Hi Crave, I'd like to order:\n${lines.join('\n')}`;
}

/**
 * INIT MENU CART - REMOVED
 * Cart logic is now handled in menu.html with array-based structure
 */

/**
 * Initialize Mobile Sticky Order Bar
 */
function initMobileOrderBar() {
  const orderBtn = document.getElementById('mobileOrderNow');
  const phoneNumber = '233550020788';

  if (!orderBtn) return;

  orderBtn.addEventListener('click', function() {
    const message = 'Hi Crave, I would like to place an order.';
    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  });
}


/**
 * Initialize Testimonials Carousel Auto-Scroll + Dots
 */
function initTestimonialsCarousel() {
  const sections = document.querySelectorAll('.testimonials-section');
  if (!sections.length) return;

  sections.forEach(section => {
    const carousel = section.querySelector('.testimonials-grid');
    const slides = carousel ? Array.from(carousel.querySelectorAll('.testimonial-card')) : [];
    if (!carousel || !slides.length) return;

    let currentSlide = 0;
    let intervalId = null;

    // Activate first slide
    function updateSlides() {
      slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === currentSlide);
      });
      const dots = section.querySelectorAll('.testimonial-dot');
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
      });
    }

    function moveTo(index) {
      currentSlide = (index + slides.length) % slides.length;
      updateSlides();
      resetAutoScroll();
    }

    function prevSlide() {
      moveTo(currentSlide - 1);
    }

    function nextSlide() {
      moveTo(currentSlide + 1);
    }

    function resetAutoScroll() {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(nextSlide, 5000);
    }

    // Add controls
    const controls = document.createElement('div');
    controls.className = 'testimonial-controls';
    controls.innerHTML = `
      <button class="testimonial-arrow testimonial-prev" aria-label="Previous testimonial">⟨</button>
      <button class="testimonial-arrow testimonial-next" aria-label="Next testimonial">⟩</button>
    `;
    section.appendChild(controls);

    controls.querySelector('.testimonial-prev').addEventListener('click', prevSlide);
    controls.querySelector('.testimonial-next').addEventListener('click', nextSlide);

    // Add dots
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'testimonial-dots';

    slides.forEach((_, idx) => {
      const dot = document.createElement('span');
      dot.className = 'testimonial-dot';
      dot.setAttribute('aria-label', `Go to testimonial ${idx + 1}`);
      dot.addEventListener('click', () => moveTo(idx));
      dotsContainer.appendChild(dot);
    });

    section.appendChild(dotsContainer);

    updateSlides();
    resetAutoScroll();

    section.addEventListener('mouseenter', function() {
      if (intervalId) clearInterval(intervalId);
    });

    section.addEventListener('mouseleave', function() {
      resetAutoScroll();
    });
  });
}



