/**
 * CRAVE Environment Configuration Loader
 * Loads environment variables and makes them available globally
 */

(function() {
    // Default environment variables for development
    const defaultEnv = {
        APP_ENV: 'development',
        API_BASE_URL: 'http://localhost:4000',
        PAYSTACK_PUBLIC_KEY: 'pk_test_placeholder',
        APP_URL: 'http://localhost:3000'
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
