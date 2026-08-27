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
        return await window.APIClient.post('/api/auth/login', credentials, { 
            useCache: false 
        });
    }

    /**
     * User registration
     * POST /api/auth/register
     */
    async function register(userData) {
        if (!window.APIClient) throw new Error('API client not available');
        return await window.APIClient.post('/api/auth/register', userData, { 
            useCache: false,
            skipRetry: true  // Prevent automatic retries for registration
        });
    }

    /**
     * User logout
     * POST /api/auth/logout
     */
    async function logout() {
        if (!window.APIClient) throw new Error('API client not available');
        return await window.APIClient.post('/api/auth/logout', {}, { 
            useCache: false 
        });
    }

    /**
     * Refresh access token
     * POST /api/auth/refresh
     */
    async function refreshToken(refreshToken) {
        if (!window.APIClient) throw new Error('API client not available');
        return await window.APIClient.post('/api/auth/refresh', { refreshToken }, { 
            useCache: false 
        });
    }

    /**
     * Get current user
     * GET /api/auth/me
     */
    async function getCurrentUser() {
        if (!window.APIClient) throw new Error('API client not available');
        return await window.APIClient.get('/api/auth/me', { 
            useCache: false 
        });
    }

    /**
     * Get user's full reward state
     * GET /api/rewards
     */
    async function getRewards() {
        if (!window.APIClient) throw new Error('API client not available');
        return await window.APIClient.get('/api/rewards', { 
            useCache: false 
        });
    }

    /**
     * Create reward transaction
     * POST /api/rewards/transactions
     */
    async function createRewardTransaction(transactionData) {
        if (!window.APIClient) throw new Error('API client not available');
        return await window.APIClient.post('/api/rewards/transactions', transactionData, { 
            useCache: false 
        });
    }

    // Public API
    return {
        login,
        register,
        logout,
        refreshToken,
        getCurrentUser,
        getRewards,
        createRewardTransaction
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
