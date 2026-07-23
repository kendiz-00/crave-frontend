/**
 * CRAVE Authentication UI Helpers
 * UI utilities for authentication state and forms
 */

const AuthManager = typeof AuthManager !== 'undefined' ? AuthManager : null;

if (!AuthManager) {
    console.error('AuthManager not loaded. Make sure auth-manager.js is loaded before auth-ui.js');
}

const AuthUI = (function() {
    'use strict';

    /**
     * Update navbar based on authentication state
     */
    function updateNavbar() {
        const isAuthenticated = AuthManager.isAuthenticated();
        const user = AuthManager.getUserData();

        // Find navbar auth section - try both class names
        const navbarAuth = document.querySelector('.crave-navbar__auth-guest') || document.querySelector('.navbar-auth');
        if (!navbarAuth) return;
        
        if (isAuthenticated && user) {
            // Logged in state
            navbarAuth.innerHTML = `
                <div class="navbar-user">
                    <div class="navbar-avatar">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=d4a574&color=fff&size=40" alt="${user.name || 'User'}">
                    </div>
                    <div class="navbar-user-info">
                        <span class="navbar-user-name">${user.name || 'User'}</span>
                    </div>
                    <div class="navbar-dropdown">
                        <button class="navbar-dropdown-toggle" aria-label="User menu">
                            <i class="fa-solid fa-chevron-down"></i>
                        </button>
                        <div class="navbar-dropdown-menu">
                            <a href="profile.html" class="navbar-dropdown-item">
                                <i class="fa-solid fa-user"></i>
                                My Profile
                            </a>
                            <a href="profile.html#orders" class="navbar-dropdown-item">
                                <i class="fa-solid fa-receipt"></i>
                                My Orders
                            </a>
                            <a href="rewards.html" class="navbar-dropdown-item">
                                <i class="fa-solid fa-gift"></i>
                                Rewards
                            </a>
                            <a href="vip.html" class="navbar-dropdown-item">
                                <i class="fa-solid fa-crown"></i>
                                VIP
                            </a>
                            <div class="navbar-dropdown-divider"></div>
                            <button class="navbar-dropdown-item navbar-logout-btn">
                                <i class="fa-solid fa-sign-out-alt"></i>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add dropdown toggle functionality
            const dropdownToggle = navbarAuth.querySelector('.navbar-dropdown-toggle');
            const dropdownMenu = navbarAuth.querySelector('.navbar-dropdown-menu');
            
            if (dropdownToggle && dropdownMenu) {
                dropdownToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownMenu.classList.toggle('show');
                });
                
                // Close dropdown when clicking outside
                document.addEventListener('click', () => {
                    dropdownMenu.classList.remove('show');
                });
                
                // Logout button
                const logoutBtn = navbarAuth.querySelector('.navbar-logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', async () => {
                        await handleLogout();
                    });
                }
            }
        } else {
            // Logged out state
            navbarAuth.innerHTML = `
                <a href="login.html" class="navbar-link navbar-login-btn">Login</a>
                <a href="register.html" class="navbar-link navbar-register-btn">Register</a>
            `;
        }
    }

    /**
     * Handle logout
     */
    async function handleLogout() {
        showLoading();
        
        try {
            await AuthManager.logout();
            
            // Store redirect destination
            sessionStorage.removeItem('redirectAfterLogin');
            
            // Redirect to home
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            showError('Logout failed. Please try again.');
            hideLoading();
        }
    }

    /**
     * Show loading state
     */
    function showLoading(element = null) {
        if (element) {
            element.classList.add('loading');
            element.disabled = true;
        } else {
            document.body.classList.add('auth-loading');
        }
    }

    /**
     * Hide loading state
     */
    function hideLoading(element = null) {
        if (element) {
            element.classList.remove('loading');
            element.disabled = false;
        } else {
            document.body.classList.remove('auth-loading');
        }
    }

    /**
     * Show success notification
     */
    function showSuccess(message) {
        showNotification(message, 'success');
    }

    /**
     * Show error notification
     */
    function showError(message) {
        showNotification(message, 'error');
    }

    /**
     * Show notification
     */
    function showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.auth-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `auth-notification auth-notification-${type}`;
        notification.innerHTML = `
            <div class="auth-notification-content">
                <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    /**
     * Validate email
     */
    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /**
     * Validate password strength
     */
    function validatePassword(password) {
        const result = {
            isValid: false,
            strength: 'weak',
            errors: []
        };
        
        if (password.length < 8) {
            result.errors.push('Password must be at least 8 characters');
        }
        
        if (!/[a-z]/.test(password)) {
            result.errors.push('Password must contain a lowercase letter');
        }
        
        if (!/[A-Z]/.test(password)) {
            result.errors.push('Password must contain an uppercase letter');
        }
        
        if (!/[0-9]/.test(password)) {
            result.errors.push('Password must contain a number');
        }
        
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            result.errors.push('Password must contain a special character');
        }
        
        if (result.errors.length === 0) {
            result.isValid = true;
            
            // Calculate strength
            let strengthScore = 0;
            if (password.length >= 12) strengthScore++;
            if (/[a-z]/.test(password)) strengthScore++;
            if (/[A-Z]/.test(password)) strengthScore++;
            if (/[0-9]/.test(password)) strengthScore++;
            if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strengthScore++;
            
            if (strengthScore <= 2) result.strength = 'weak';
            else if (strengthScore <= 4) result.strength = 'medium';
            else result.strength = 'strong';
        }
        
        return result;
    }

    /**
     * Show password strength indicator
     */
    function showPasswordStrength(password, container) {
        const validation = validatePassword(password);
        
        let strengthBar = container.querySelector('.password-strength-bar');
        let strengthText = container.querySelector('.password-strength-text');
        
        if (!strengthBar) {
            strengthBar = document.createElement('div');
            strengthBar.className = 'password-strength-bar';
            container.appendChild(strengthBar);
        }
        
        if (!strengthText) {
            strengthText = document.createElement('div');
            strengthText.className = 'password-strength-text';
            container.appendChild(strengthText);
        }
        
        // Update strength bar
        strengthBar.className = 'password-strength-bar';
        if (password.length > 0) {
            strengthBar.classList.add(`strength-${validation.strength}`);
        }
        
        // Update strength text
        if (password.length === 0) {
            strengthText.textContent = '';
        } else if (validation.isValid) {
            strengthText.textContent = `Password strength: ${validation.strength}`;
        } else {
            strengthText.textContent = validation.errors[0];
        }
    }

    /**
     * Toggle password visibility
     */
    function togglePasswordVisibility(input, toggleBtn) {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        
        const icon = toggleBtn.querySelector('i');
        if (icon) {
            icon.className = type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
        }
    }

    /**
     * Handle login form submission
     */
    async function handleLoginForm(form, redirectUrl = null) {
        const email = form.querySelector('[name="email"]').value;
        const password = form.querySelector('[name="password"]').value;
        const rememberMe = form.querySelector('[name="rememberMe"]')?.checked || false;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Validation
        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }
        
        if (!validateEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }
        
        showLoading(submitBtn);
        
        try {
            const result = await AuthManager.login({ email, password }, rememberMe);
            
            if (result.success) {
                showSuccess('Login successful!');
                
                // Migrate anonymous rewards
                const anonymousRewards = AuthManager.migrateAnonymousRewards();
                if (anonymousRewards) {
                    // TODO: Send anonymous rewards to backend
                    AuthManager.clearAnonymousRewards();
                    showSuccess('Your rewards have been saved to your account!');
                }
                
                // Update navbar
                updateNavbar();
                
                // Redirect
                const redirect = redirectUrl || sessionStorage.getItem('redirectAfterLogin') || 'index.html';
                sessionStorage.removeItem('redirectAfterLogin');
                setTimeout(() => {
                    window.location.href = redirect;
                }, 500);
            } else {
                showError(result.error || 'Login failed');
                hideLoading(submitBtn);
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Login failed. Please try again.');
            hideLoading(submitBtn);
        }
    }

    /**
     * Handle registration form submission
     */
    async function handleRegisterForm(form) {
        const name = form.querySelector('[name="name"]').value;
        const email = form.querySelector('[name="email"]').value;
        const password = form.querySelector('[name="password"]').value;
        const confirmPassword = form.querySelector('[name="confirmPassword"]').value;
        const phone = form.querySelector('[name="phone"]')?.value || '';
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Validation
        if (!name || !email || !password || !confirmPassword) {
            showError('Please fill in all required fields');
            return;
        }
        
        if (!validateEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }
        
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            showError(passwordValidation.errors[0]);
            return;
        }
        
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        showLoading(submitBtn);
        
        try {
            const result = await AuthManager.register({ name, email, password, phone });
            
            if (result.success) {
                showSuccess('Registration successful!');
                
                // Update navbar
                updateNavbar();
                
                // Redirect to home
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            } else {
                showError(result.error || 'Registration failed');
                hideLoading(submitBtn);
            }
        } catch (error) {
            console.error('Registration error:', error);
            showError('Registration failed. Please try again.');
            hideLoading(submitBtn);
        }
    }

    /**
     * Initialize auth UI listeners
     */
    function initialize() {
        // Update navbar on auth state changes
        AuthManager.on('authStateChanged', () => {
            updateNavbar();
        });
        
        // Initial navbar update
        updateNavbar();
    }

    // Public API
    return {
        updateNavbar,
        handleLogout,
        showLoading,
        hideLoading,
        showSuccess,
        showError,
        showNotification,
        validateEmail,
        validatePassword,
        showPasswordStrength,
        togglePasswordVisibility,
        handleLoginForm,
        handleRegisterForm,
        initialize
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthUI;
}

// Auto-initialize on load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (AuthUI && AuthManager) {
            AuthUI.initialize();
        }
    });
}
