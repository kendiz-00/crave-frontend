/**
 * CRAVE Environment Configuration Loader
 * Loads environment variables and makes them available globally
 */

(function() {
    // 🔍 DIAGNOSTIC: Log initial state
    console.log('🔍 env.js - INITIAL STATE');
    console.log('  - location.href:', typeof window !== 'undefined' ? window.location.href : 'N/A');
    console.log('  - window.ENV before init:', typeof window !== 'undefined' ? window.ENV : 'N/A');
    console.log('  - document.scripts:', typeof document !== 'undefined' ? Array.from(document.querySelectorAll('script[src]')).map(s => s.src) : 'N/A');
    
    const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const defaultApiUrl = isLocalhost 
        ? 'http://localhost:3000' 
        : 'https://crave-backend-oie3.onrender.com';

    const defaultAppUrl = isLocalhost 
        ? 'http://localhost:3000' 
        : (typeof window !== 'undefined' ? window.location.origin : 'https://crave-frontend.vercel.app');

    // Default environment variables
    const defaultEnv = {
        APP_ENV: isLocalhost ? 'development' : 'production',
        API_BASE_URL: defaultApiUrl,
        PAYSTACK_PUBLIC_KEY: 'pk_test_placeholder',
        APP_URL: defaultAppUrl
    };

    // Try to load from window.ENV (injected by build process or server)
    if (window.ENV) {
        console.log('🔍 env.js - window.ENV EXISTS BEFORE INIT, merging with defaults');
        console.log('  - Existing window.ENV:', window.ENV);
        // Merge with defaults
        window.ENV = { ...defaultEnv, ...window.ENV };
    } else {
        console.log('🔍 env.js - window.ENV DOES NOT EXIST, using defaults');
        // Use defaults
        window.ENV = defaultEnv;
    }

    // Force production API base URL if using legacy staging URL or on remote host
    if (!isLocalhost && (!window.ENV.API_BASE_URL || window.ENV.API_BASE_URL.includes('staging') || window.ENV.API_BASE_URL.includes('crave-backend-staging.onrender.com'))) {
        window.ENV.API_BASE_URL = 'https://crave-backend-oie3.onrender.com';
    }

    // 🔍 DIAGNOSTIC: Log final state
    console.log('🔍 env.js - FINAL STATE');
    console.log('  - window.ENV.API_BASE_URL:', window.ENV.API_BASE_URL);
    console.log('  - window.ENV.APP_ENV:', window.ENV.APP_ENV);

    // Log environment in development only
    if (window.ENV.APP_ENV === 'development') {
        console.log('Environment loaded:', {
            APP_ENV: window.ENV.APP_ENV,
            API_BASE_URL: window.ENV.API_BASE_URL,
            APP_URL: window.ENV.APP_URL
        });
    }
})();

