/**
 * CRAVE Cart Synchronization Module
 * Handles cart synchronization between localStorage and backend
 * Migrates anonymous cart to user account on login
 */

const CartSync = (function() {
    'use strict';

    const CART_STORAGE_KEY = 'craveCart';
    const SYNC_DEBOUNCE_MS = 1000;
    let syncTimeout = null;
    let isSyncing = false;

    /**
     * Get cart from localStorage
     */
    function getLocalCart() {
        try {
            const cart = localStorage.getItem(CART_STORAGE_KEY);
            return cart ? JSON.parse(cart) : [];
        } catch (error) {
            console.error('Error reading cart from localStorage:', error);
            return [];
        }
    }

    /**
     * Save cart to localStorage
     */
    function saveLocalCart(cart) {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
            return true;
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
            return false;
        }
    }

    /**
     * Check if user is authenticated
     */
    function isAuthenticated() {
        if (typeof AuthManager !== 'undefined' && AuthManager.isAuthenticated) {
            return AuthManager.isAuthenticated();
        }
        return false;
    }

    /**
     * Get current user
     */
    function getCurrentUser() {
        if (typeof AuthManager !== 'undefined' && AuthManager.getUser) {
            return AuthManager.getUser();
        }
        return null;
    }

    /**
     * Sync cart to backend (debounced)
     */
    function syncToBackend() {
        if (!isAuthenticated()) {
            return;
        }

        // Clear existing timeout
        if (syncTimeout) {
            clearTimeout(syncTimeout);
        }

        // Set new timeout
        syncTimeout = setTimeout(async () => {
            if (isSyncing) return;
            
            isSyncing = true;
            try {
                const cart = getLocalCart();
                const user = getCurrentUser();
                
                if (user && cart.length > 0) {
                    // Sync to backend via API
                    if (typeof APIClient !== 'undefined') {
                        await APIClient.put('/cart/sync', { 
                            userId: user.id,
                            items: cart 
                        });
                    }
                }
            } catch (error) {
                console.error('Error syncing cart to backend:', error);
            } finally {
                isSyncing = false;
            }
        }, SYNC_DEBOUNCE_MS);
    }

    /**
     * Load cart from backend
     */
    async function loadFromBackend() {
        if (!isAuthenticated()) {
            return null;
        }

        try {
            const user = getCurrentUser();
            if (!user) return null;

            if (typeof APIClient !== 'undefined') {
                const response = await APIClient.get(`/cart/${user.id}`);
                if (response.success && response.data) {
                    return response.data.items || [];
                }
            }
        } catch (error) {
            console.error('Error loading cart from backend:', error);
        }
        return null;
    }

    /**
     * Merge local cart with backend cart
     */
    function mergeCarts(localCart, backendCart) {
        const merged = [...backendCart];
        const backendItemIds = new Set(backendCart.map(item => `${item.id}_${JSON.stringify(item.customizations)}`));

        // Add items from local cart that aren't in backend cart
        localCart.forEach(localItem => {
            const itemKey = `${localItem.id}_${JSON.stringify(localItem.customizations)}`;
            if (!backendItemIds.has(itemKey)) {
                merged.push(localItem);
            }
        });

        return merged;
    }

    /**
     * Migrate anonymous cart to user account
     */
    async function migrateCart() {
        const user = getCurrentUser();
        if (!user) return;

        const localCart = getLocalCart();
        if (localCart.length === 0) return;

        try {
            // Get backend cart
            const backendCart = await loadFromBackend();
            
            // Merge carts
            const mergedCart = mergeCarts(localCart, backendCart || []);
            
            // Save merged cart to backend
            if (typeof APIClient !== 'undefined') {
                await APIClient.put('/cart/sync', {
                    userId: user.id,
                    items: mergedCart
                });
            }
            
            // Update local cart
            saveLocalCart(mergedCart);
            
            console.log('Cart migrated successfully for user:', user.id);
        } catch (error) {
            console.error('Error migrating cart:', error);
        }
    }

    /**
     * Initialize cart sync
     */
    function initialize() {
        // Listen for auth state changes
        if (typeof AuthManager !== 'undefined') {
            AuthManager.on('login', async () => {
                await migrateCart();
            });

            AuthManager.on('logout', () => {
                // Clear local cart on logout or keep it as guest cart
                // Uncomment next line to clear cart on logout
                // saveLocalCart([]);
            });
        }

        // Listen for cart changes (custom event)
        document.addEventListener('cartChanged', () => {
            syncToBackend();
        });

        // Load cart from backend on page load if authenticated
        if (isAuthenticated()) {
            loadFromBackend().then(backendCart => {
                if (backendCart) {
                    const localCart = getLocalCart();
                    const mergedCart = mergeCarts(localCart, backendCart);
                    saveLocalCart(mergedCart);
                    
                    // Dispatch event to update UI
                    document.dispatchEvent(new CustomEvent('cartLoaded', { detail: mergedCart }));
                }
            });
        }
    }

    /**
     * Add item to cart with sync
     */
    function addItem(item) {
        const cart = getLocalCart();
        cart.push(item);
        saveLocalCart(cart);
        syncToBackend();
        document.dispatchEvent(new CustomEvent('cartChanged', { detail: cart }));
    }

    /**
     * Remove item from cart with sync
     */
    function removeItem(index) {
        const cart = getLocalCart();
        cart.splice(index, 1);
        saveLocalCart(cart);
        syncToBackend();
        document.dispatchEvent(new CustomEvent('cartChanged', { detail: cart }));
    }

    /**
     * Update item quantity with sync
     */
    function updateQuantity(index, quantity) {
        const cart = getLocalCart();
        if (cart[index]) {
            cart[index].quantity = quantity;
            saveLocalCart(cart);
            syncToBackend();
            document.dispatchEvent(new CustomEvent('cartChanged', { detail: cart }));
        }
    }

    /**
     * Clear cart with sync
     */
    function clearCart() {
        saveLocalCart([]);
        syncToBackend();
        document.dispatchEvent(new CustomEvent('cartChanged', { detail: [] }));
    }

    // Public API
    return {
        initialize,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getLocalCart,
        syncToBackend,
        loadFromBackend,
        migrateCart
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CartSync;
}
