/**
 * CRAVE Authentication UI Helpers
 * UI utilities for authentication state and forms
 */

const _AuthManager = (typeof window !== 'undefined' && window.AuthManager) ? window.AuthManager : (typeof AuthManager !== 'undefined' ? AuthManager : null);

if (!_AuthManager) {
    console.error('AuthManager not loaded. Make sure auth-manager.js is loaded before auth-ui.js');
}

const AuthUI = (function() {
    'use strict';

    /**
     * Update navbar based on authentication state
     */
    function updateNavbar() {
        const isAuthenticated = _AuthManager ? _AuthManager.isAuthenticated() : false;
        const user = _AuthManager ? _AuthManager.getUserData() : null;

        // Target the parent auth container or the guest wrapper
        const parentAuth = document.getElementById('craveNavbarAuth') || document.querySelector('.crave-navbar__auth');
        const navbarAuth = parentAuth || document.querySelector('.crave-navbar__auth-guest') || document.querySelector('.navbar-auth');
        if (!navbarAuth) return;

        // Toggle body authenticated class for mobile menu styling
        if (isAuthenticated) {
            document.body.classList.add('authenticated');
        } else {
            document.body.classList.remove('authenticated');
        }

        if (isAuthenticated && user) {
            const initial = (user.name || 'U').charAt(0).toUpperCase();
            navbarAuth.innerHTML = `
                <div class="crave-navbar__user">
                    <button type="button" class="crave-navbar__user-trigger" id="craveUserDropdownToggle" aria-expanded="false" aria-label="User menu">
                        <span class="crave-navbar__user-avatar">${initial}</span>
                        <span class="crave-navbar__user-name">${user.name || 'User'}</span>
                        <i class="fa-solid fa-chevron-down crave-navbar__user-chevron"></i>
                    </button>
                    <div class="crave-navbar__user-dropdown" id="craveUserDropdown">
                        <ul class="crave-navbar__user-dropdown-list">
                            <li class="crave-navbar__user-dropdown-item">
                                <a href="profile.html" class="crave-navbar__user-dropdown-link">
                                    <i class="fa-solid fa-user"></i> My Profile
                                </a>
                            </li>
                            <li class="crave-navbar__user-dropdown-item">
                                <a href="profile.html#orders" class="crave-navbar__user-dropdown-link">
                                    <i class="fa-solid fa-receipt"></i> My Orders
                                </a>
                            </li>
                            <li class="crave-navbar__user-dropdown-item">
                                <a href="rewards.html" class="crave-navbar__user-dropdown-link">
                                    <i class="fa-solid fa-gift"></i> Rewards
                                </a>
                            </li>
                            <li class="crave-navbar__user-dropdown-item">
                                <a href="vip.html" class="crave-navbar__user-dropdown-link">
                                    <i class="fa-solid fa-crown"></i> VIP
                                </a>
                            </li>
                            <li class="crave-navbar__user-dropdown-divider"></li>
                            <li class="crave-navbar__user-dropdown-item">
                                <button type="button" class="crave-navbar__user-dropdown-link crave-navbar__user-dropdown-link--logout navbar-logout-btn">
                                    <i class="fa-solid fa-sign-out-alt"></i> Logout
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            `;

            const dropdownToggle = navbarAuth.querySelector('#craveUserDropdownToggle') || navbarAuth.querySelector('.crave-navbar__user-trigger');
            const dropdownMenu = navbarAuth.querySelector('#craveUserDropdown') || navbarAuth.querySelector('.crave-navbar__user-dropdown');

            if (dropdownToggle && dropdownMenu) {
                dropdownToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isExpanded = dropdownMenu.classList.contains('crave-navbar__user-dropdown--active');
                    dropdownToggle.setAttribute('aria-expanded', !isExpanded);
                    dropdownMenu.classList.toggle('crave-navbar__user-dropdown--active');
                    dropdownMenu.classList.toggle('show');
                });

                document.addEventListener('click', () => {
                    dropdownToggle.setAttribute('aria-expanded', 'false');
                    dropdownMenu.classList.remove('crave-navbar__user-dropdown--active');
                    dropdownMenu.classList.remove('show');
                });

                const logoutBtn = navbarAuth.querySelector('.navbar-logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', async () => {
                        await handleLogout();
                    });
                }
            }
        } else {
            // Guest state preserving premium class names
            navbarAuth.innerHTML = `
                <div class="crave-navbar__auth-guest">
                    <a href="login.html" class="crave-navbar__auth-link">Login</a>
                    <a href="register.html" class="crave-navbar__auth-btn">Join CRAVE</a>
                </div>
            `;
        }
    }

    /**
     * Handle logout
     */
    async function handleLogout() {
        showLoading();
        
        try {
            await _AuthManager.logout();
            
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
            const result = await _AuthManager.login({ email, password }, rememberMe);
            
            if (result.success) {
                showSuccess('Login successful!');
                
                // Migrate anonymous rewards
                const anonymousRewards = _AuthManager.migrateAnonymousRewards();
                if (anonymousRewards) {
                    // TODO: Send anonymous rewards to backend
                    _AuthManager.clearAnonymousRewards();
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
            const result = await _AuthManager.register({ name, email, password, phone });
            
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
        _AuthManager.on('authStateChanged', () => {
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
        if (AuthUI && _AuthManager) {
            AuthUI.initialize();
        }
    });
}
