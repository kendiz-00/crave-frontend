/**
 * CRAVE API Configuration
 * Centralized API configuration for the frontend
 */

const getFallbackApiUrl = () => {
    if (typeof window !== 'undefined' && window.location) {
        const host = window.location.hostname;
        if (host !== 'localhost' && host !== '127.0.0.1') {
            return 'https://crave-backend-oie3.onrender.com';
        }
    }
    return 'http://localhost:4000';
};

// Get API base URL from environment variable or use dynamic default
const API_BASE_URL = (typeof window !== 'undefined' && window.ENV?.API_BASE_URL) 
    ? window.ENV.API_BASE_URL 
    : getFallbackApiUrl();

const APIConfig = {
    // Base URL - from environment variable
    baseURL: API_BASE_URL,

    // API endpoints
    endpoints: {
        // Menu endpoints
        menu: '/api/menu',
        menuFeatured: '/api/menu/featured',
        menuSearch: '/api/menu/search',
        menuCategory: '/api/menu/category',
        
        // Category endpoints
        categories: '/api/categories',
        
        // Auth endpoints (for future use)
        auth: {
            login: '/api/auth/login',
            register: '/api/auth/register',
            refresh: '/api/auth/refresh',
            logout: '/api/auth/logout'
        },
        
        // Cart endpoints (for future use)
        cart: '/api/cart',
        
        // Order endpoints (for future use)
        orders: '/api/orders'
    },
    
    // Request timeout in milliseconds (30 seconds for Render cold starts)
    timeout: 30000,
    
    // Cache duration in milliseconds (5 minutes)
    cacheDuration: 5 * 60 * 1000,
    
    // Retry configuration
    retry: {
        maxAttempts: 3,
        delay: 1000,
        backoffMultiplier: 2
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIConfig;
}
