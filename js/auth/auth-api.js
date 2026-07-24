/**
 * CRAVE Authentication API
 * Authentication-specific API methods using the existing APIClient
 */

const _APIClient = (typeof window !== 'undefined' && window.APIClient) ? window.APIClient : (typeof APIClient !== 'undefined' ? APIClient : null);

if (!_APIClient) {
    console.error('APIClient not loaded. Make sure api.js is loaded before auth-api.js');
}

const AuthAPI = (function() {
    'use strict';

    /**
     * User login
     * POST /api/auth/login
     */
    async function login(credentials) {
        if (!_APIClient) throw new Error('API client not available');
        return await _APIClient.post('/auth/login', credentials, { 
            useCache: false 
        });
    }

    /**
     * User registration
     * POST /api/auth/register
     */
    async function register(userData) {
        if (!_APIClient) throw new Error('API client not available');
        return await _APIClient.post('/auth/register', userData, { 
            useCache: false 
        });
    }

    /**
     * User logout
     * POST /api/auth/logout
     */
    async function logout() {
        if (!_APIClient) throw new Error('API client not available');
        return await _APIClient.post('/auth/logout', {}, { 
            useCache: false 
        });
    }

    /**
     * Refresh access token
     * POST /api/auth/refresh
     */
    async function refreshToken(refreshToken) {
        if (!_APIClient) throw new Error('API client not available');
        return await _APIClient.post('/auth/refresh', { refreshToken }, { 
            useCache: false 
        });
    }

    /**
     * Get current user
     * GET /api/auth/me
     */
    async function getCurrentUser() {
        if (!_APIClient) throw new Error('API client not available');
        return await _APIClient.get('/auth/me', { 
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
