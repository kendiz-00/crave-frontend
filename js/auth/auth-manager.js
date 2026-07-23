/**
 * CRAVE Authentication Manager
 * Manages authentication state, tokens, and session lifecycle
 */

const AuthAPI = typeof AuthAPI !== 'undefined' ? AuthAPI : null;

if (!AuthAPI) {
    console.warn('AuthAPI not loaded. Authentication API calls will not work. Load auth-api.js before auth-manager.js for full functionality.');
}

const AuthManager = (function() {
    'use strict';

    // State
    let isAuthenticated = false;
    let currentUser = null;
    let accessToken = null;
    let refreshToken = null;
    let isRefreshing = false;
    let refreshSubscribers = [];

    // Storage keys
    const STORAGE_KEYS = {
        ACCESS_TOKEN: 'crave_access_token',
        REFRESH_TOKEN: 'crave_refresh_token',
        USER_DATA: 'crave_user_data',
        REMEMBER_ME: 'crave_remember_me'
    };

    // Event system
    const events = {};

    /**
     * Subscribe to auth events
     */
    function on(event, callback) {
        if (!events[event]) events[event] = [];
        events[event].push(callback);
    }

    /**
     * Unsubscribe from auth events
     */
    function off(event, callback) {
        if (!events[event]) return;
        events[event] = events[event].filter(cb => cb !== callback);
    }

    /**
     * Emit auth event
     */
    function emit(event, data) {
        if (!events[event]) return;
        events[event].forEach(callback => callback(data));
    }

    /**
     * Get access token
     */
    function getAccessToken() {
        // Check memory first
        if (accessToken) return accessToken;
        
        // Check sessionStorage
        const stored = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (stored) {
            accessToken = stored;
            return accessToken;
        }
        
        return null;
    }

    /**
     * Set access token
     */
    function setAccessToken(token) {
        accessToken = token;
        sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    }

    /**
     * Get refresh token
     */
    function getRefreshToken() {
        if (refreshToken) return refreshToken;
        
        const stored = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (stored) {
            refreshToken = stored;
            return refreshToken;
        }
        
        return null;
    }

    /**
     * Set refresh token
     */
    function setRefreshToken(token, rememberMe = false) {
        refreshToken = token;
        if (rememberMe) {
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
            localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
        } else {
            sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
            localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
        }
    }

    /**
     * Clear all tokens
     */
    function clearTokens() {
        accessToken = null;
        refreshToken = null;
        sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
    }

    /**
     * Get user data
     */
    function getUserData() {
        if (currentUser) return currentUser;
        
        const stored = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (stored) {
            try {
                currentUser = JSON.parse(stored);
                return currentUser;
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        
        return null;
    }

    /**
     * Set user data
     */
    function setUserData(user) {
        currentUser = user;
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    }

    /**
     * Clear user data
     */
    function clearUserData() {
        currentUser = null;
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }

    /**
     * Check if user is authenticated
     */
    function checkAuth() {
        const token = getAccessToken();
        const user = getUserData();
        isAuthenticated = !!(token && user);
        return isAuthenticated;
    }

    /**
     * Login user
     */
    async function login(credentials, rememberMe = false) {
        try {
            const response = await AuthAPI.login(credentials);
            
            if (response.success && response.data) {
                const { accessToken, refreshToken, user } = response.data;
                
                // Migrate anonymous rewards data before setting new user
                migrateAnonymousRewards(user.id);
                
                setAccessToken(accessToken);
                setRefreshToken(refreshToken, rememberMe);
                setUserData(user);
                isAuthenticated = true;
                
                emit('login', user);
                emit('authStateChanged', { authenticated: true, user });
                
                return { success: true, user };
            }
            
            return { success: false, error: response.message || 'Login failed' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message || 'Login failed' };
        }
    }

    /**
     * Migrate anonymous rewards data to user account
     */
    function migrateAnonymousRewards(userId) {
        try {
            const anonymousKeys = [
                'crave_points',
                'crave_tier',
                'crave_achievements',
                'crave_promo_codes_used',
                'crave_spins',
                'crave_last_spin',
                'crave_daily_streak',
                'crave_last_daily_claim',
                'crave_referrals',
                'crave_birthday',
                'crave_vip_status',
                'crave_vip_expiry',
                'crave_orders',
                'crave_total_spent',
                'crave_item_orders',
                'crave_weekend_orders',
                'crave_breakfast_orders',
                'crave_late_night_orders',
                'crave_surprise_reward_last',
                'crave_reward_vault',
                'crave_total_spins',
                'crave_total_prizes_won',
                'crave_total_points_won',
                'crave_total_savings',
                'crave_spin_history',
                'crave_last_spin_time'
            ];

            anonymousKeys.forEach(key => {
                const anonymousValue = localStorage.getItem(key);
                if (anonymousValue !== null) {
                    const userKey = `${key}_${userId}`;
                    // Only migrate if user doesn't already have data
                    if (!localStorage.getItem(userKey)) {
                        localStorage.setItem(userKey, anonymousValue);
                        // Optionally clear anonymous data
                        // localStorage.removeItem(key);
                    }
                }
            });

            console.log('Rewards data migrated for user:', userId);
        } catch (error) {
            console.error('Error migrating rewards data:', error);
        }
    }

    /**
     * Register user
     */
    async function register(userData) {
        try {
            const response = await AuthAPI.register(userData);
            
            if (response.success && response.data) {
                const { accessToken, refreshToken, user } = response.data;
                
                // Migrate anonymous rewards data before setting new user
                migrateAnonymousRewards(user.id);
                
                setAccessToken(accessToken);
                setRefreshToken(refreshToken, true);
                setUserData(user);
                isAuthenticated = true;
                
                emit('login', user);
                emit('authStateChanged', { authenticated: true, user });
                emit('register', user);
                
                return { success: true, user };
            }
            
            return { success: false, error: response.message || 'Registration failed' };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message || 'Registration failed' };
        }
    }

    /**
     * Logout user
     */
    async function logout() {
        try {
            await AuthAPI.logout();
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            const user = getUserData();
            clearTokens();
            clearUserData();
            isAuthenticated = false;
            
            emit('logout', user);
            emit('authStateChanged', { authenticated: false, user: null });
        }
    }

    /**
     * Refresh access token
     */
    async function refreshAccessToken() {
        if (isRefreshing) {
            return new Promise((resolve) => {
                refreshSubscribers.push(resolve);
            });
        }

        isRefreshing = true;
        const token = getRefreshToken();

        if (!token) {
            await logout();
            return null;
        }

        try {
            const response = await AuthAPI.refreshToken(token);
            
            if (response.success && response.data) {
                const { accessToken, refreshToken: newRefreshToken } = response.data;
                
                setAccessToken(accessToken);
                if (newRefreshToken) {
                    const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
                    setRefreshToken(newRefreshToken, rememberMe);
                }
                
                // Resolve all waiting subscribers
                refreshSubscribers.forEach(resolve => resolve(accessToken));
                refreshSubscribers = [];
                
                emit('tokenRefreshed', accessToken);
                return accessToken;
            } else {
                // Refresh failed, logout
                await logout();
                return null;
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            await logout();
            return null;
        } finally {
            isRefreshing = false;
        }
    }

    /**
     * Fetch current user
     */
    async function fetchCurrentUser() {
        try {
            const response = await AuthAPI.getCurrentUser();
            
            if (response.success && response.data) {
                setUserData(response.data);
                currentUser = response.data;
                emit('userUpdated', response.data);
                return response.data;
            }
            
            return null;
        } catch (error) {
            console.error('Fetch current user error:', error);
            return null;
        }
    }

    /**
     * Initialize auth state from storage
     */
    function initialize() {
        const token = getAccessToken();
        const user = getUserData();
        
        if (token && user) {
            isAuthenticated = true;
            emit('authStateChanged', { authenticated: true, user });
        }
        
        return checkAuth();
    }

    /**
     * Migrate anonymous rewards data to authenticated account
     */
    function migrateAnonymousRewards() {
        try {
            const anonymousRewards = {};
            
            // Collect all anonymous reward data from localStorage
            const rewardKeys = [
                'crave_points',
                'crave_tier',
                'crave_achievements',
                'crave_promo_codes_used',
                'crave_spins',
                'crave_last_spin',
                'crave_daily_streak',
                'crave_last_daily_claim',
                'crave_referrals',
                'crave_birthday',
                'crave_reward_vault',
                'crave_total_spins',
                'crave_total_prizes_won',
                'crave_total_points_won',
                'crave_total_savings',
                'crave_spin_history',
                'crave_last_spin_time',
                'crave_orders',
                'crave_total_spent',
                'crave_item_orders',
                'crave_weekend_orders',
                'crave_breakfast_orders',
                'crave_late_night_orders',
                'crave_vip_status',
                'crave_vip_expiry',
                'crave_surprise_reward_last',
                'crave_flash_deals_claimed'
            ];
            
            rewardKeys.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) {
                    anonymousRewards[key] = value;
                }
            });
            
            if (Object.keys(anonymousRewards).length > 0) {
                emit('anonymousRewardsMigrate', anonymousRewards);
                return anonymousRewards;
            }
            
            return null;
        } catch (error) {
            console.error('Error migrating anonymous rewards:', error);
            return null;
        }
    }

    /**
     * Clear anonymous rewards data after migration
     */
    function clearAnonymousRewards() {
        const rewardKeys = [
            'crave_points',
            'crave_tier',
            'crave_achievements',
            'crave_promo_codes_used',
            'crave_spins',
            'crave_last_spin',
            'crave_daily_streak',
            'crave_last_daily_claim',
            'crave_referrals',
            'crave_birthday',
            'crave_reward_vault',
            'crave_total_spins',
            'crave_total_prizes_won',
            'crave_total_points_won',
            'crave_total_savings',
            'crave_spin_history',
            'crave_last_spin_time',
            'crave_orders',
            'crave_total_spent',
            'crave_item_orders',
            'crave_weekend_orders',
            'crave_breakfast_orders',
            'crave_late_night_orders',
            'crave_vip_status',
            'crave_vip_expiry',
            'crave_surprise_reward_last',
            'crave_flash_deals_claimed'
        ];
        
        rewardKeys.forEach(key => {
            localStorage.removeItem(key);
        });
    }

    // Public API
    return {
        // State
        isAuthenticated: () => isAuthenticated,
        currentUser: () => currentUser,
        
        // Token management
        getAccessToken,
        setAccessToken,
        getRefreshToken,
        setRefreshToken,
        clearTokens,
        
        // User data
        getUserData,
        setUserData,
        clearUserData,
        
        // Auth operations
        login,
        register,
        logout,
        checkAuth,
        initialize,
        fetchCurrentUser,
        refreshAccessToken,
        
        // Data migration
        migrateAnonymousRewards,
        clearAnonymousRewards,
        
        // Event system
        on,
        off,
        emit
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}

// Auto-initialize on load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (AuthManager) {
            AuthManager.initialize();
        }
    });
}
