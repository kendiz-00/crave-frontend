/**
 * CRAVE Environment Configuration Loader
 * Loads environment variables and makes them available globally
 */

(function() {
    const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const defaultApiUrl = isLocalhost 
        ? 'http://localhost:4000' 
        : 'https://crave-backend-staging.onrender.com';

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
        // Merge with defaults
        window.ENV = { ...defaultEnv, ...window.ENV };
    } else {
        // Use defaults
        window.ENV = defaultEnv;
    }

    // Log environment in development only
    if (window.ENV.APP_ENV === 'development') {
        console.log('Environment loaded:', {
            APP_ENV: window.ENV.APP_ENV,
            API_BASE_URL: window.ENV.API_BASE_URL,
            APP_URL: window.ENV.APP_URL
        });
    }
})();

