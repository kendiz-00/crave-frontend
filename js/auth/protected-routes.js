/**
 * CRAVE Protected Routes
 * Route protection logic for authenticated pages
 */

const AuthManager = typeof AuthManager !== 'undefined' ? AuthManager : null;

if (!AuthManager) {
    console.error('AuthManager not loaded. Make sure auth-manager.js is loaded before protected-routes.js');
}

const ProtectedRoutes = (function() {
    'use strict';

    // Protected routes configuration
    const protectedRoutes = [
        'profile.html',
        'tracking.html'
    ];

    // Semi-protected routes (guests can view but with limited features)
    const semiProtectedRoutes = [
        'rewards.html',
        'vip.html'
    ];

    /**
     * Check if current route is protected
     */
    function isProtected(route) {
        const currentPage = route || window.location.pathname.split('/').pop();
        return protectedRoutes.includes(currentPage);
    }

    /**
     * Check if current route is semi-protected
     */
    function isSemiProtected(route) {
        const currentPage = route || window.location.pathname.split('/').pop();
        return semiProtectedRoutes.includes(currentPage);
    }

    /**
     * Check authentication and redirect if needed
     */
    function checkAuth() {
        const isAuthenticated = AuthManager.isAuthenticated();
        const currentPage = window.location.pathname.split('/').pop();

        // Store current page for redirect after login
        if (!isAuthenticated && (isProtected(currentPage) || isSemiProtected(currentPage))) {
            sessionStorage.setItem('redirectAfterLogin', currentPage);
            
            if (isProtected(currentPage)) {
                // Fully protected - redirect to login
                window.location.href = 'login.html';
                return false;
            }
            // Semi-protected - allow access but show login prompt
            return true;
        }

        return true;
    }

    /**
     * Initialize route protection
     */
    function initialize() {
        checkAuth();

        // Listen for auth state changes
        AuthManager.on('authStateChanged', (data) => {
            const currentPage = window.location.pathname.split('/').pop();
            
            if (data.authenticated) {
                // User logged in - if on login/register page, redirect to intended destination
                if (currentPage === 'login.html' || currentPage === 'register.html') {
                    const redirect = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
                    sessionStorage.removeItem('redirectAfterLogin');
                    window.location.href = redirect;
                }
            } else {
                // User logged out - if on protected page, redirect to home
                if (isProtected(currentPage)) {
                    window.location.href = 'index.html';
                }
            }
        });
    }

    // Public API
    return {
        isProtected,
        isSemiProtected,
        checkAuth,
        initialize
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProtectedRoutes;
}
