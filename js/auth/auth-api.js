/**
 * CRAVE Authentication API
 * Authentication-specific API methods using the existing APIClient
 */

if (typeof window !== 'undefined' && !window.APIClient) {
    console.error('APIClient not loaded. Make sure api.js is loaded before auth-api.js');
}

const AuthAPI = (function() {
    'use strict';

    /**
     * User login
     * POST /api/auth/login
     */
    async function login(credentials) {
        if (!window.APIClient) throw new Error('API client not available');
        return await window.APIClient.post('/auth/login', credentials, { 
            useCache: false 
        });
    }

    /**
     * User registration
     * POST /api/auth/register
     */
    async function register(userData) {
        if (!window.APIClient) throw new Error('API client not available');
        return await window.APIClient.post('/auth/register', userData, { 
            useCache: false 
        });
    }

    /**
     * User logout
     * POST /api/auth/logout
     */
    async function logout() {
        if (!window.APIClient) throw new Error('API client not available');
        return await window.APIClient.post('/auth/logout', {}, { 
            useCache: false 
        });
    }

    /**
     * Refresh access token
     * POST /api/auth/refresh
     */
    async function refreshToken(refreshToken) {
        if (!window.APIClient) throw new Error('API client not available');
        return await window.APIClient.post('/auth/refresh', { refreshToken }, { 
            useCache: false 
        });
    }

    /**
     * Get current user
     * GET /api/auth/me
     */
    async function getCurrentUser() {
        if (!window.APIClient) throw new Error('API client not available');
        return await window.APIClient.get('/auth/me', { 
            useCache: false 
        });
    }

    // Public API
    return {
        login,
        register,
        logout,
        refreshToken,
        getCurrentUser
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthAPI;
}

// Export to window for browser use
if (typeof window !== 'undefined') {
    window.AuthAPI = AuthAPI;
}
