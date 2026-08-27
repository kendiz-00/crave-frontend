/**
 * CRAVE Reorder Service
 * Handles reordering from previous orders with availability and price validation
 */

const ReorderService = (function() {
    'use strict';

    /**
     * Fetch current menu items from backend
     */
    async function fetchCurrentMenu() {
        try {
            if (typeof APIClient !== 'undefined') {
                const response = await APIClient.get('/api/menu');
                if (response.success && response.data) {
                    return response.data;
                }
            }
            return [];
        } catch (error) {
            console.error('Error fetching menu:', error);
            return [];
        }
    }

    /**
     * Validate order items against current menu
     * Returns validated items with current prices and availability status
     */
    async function validateOrderItems(orderItems) {
        const currentMenu = await fetchCurrentMenu();
        
        if (!currentMenu || currentMenu.length === 0) {
            return {
                validItems: [],
                unavailableItems: orderItems.map(item => ({
                    ...item,
                    reason: 'Menu not available'
                })),
                priceChanges: []
            };
        }

        // Create menu item map for O(1) lookup
        const menuMap = new Map();
        currentMenu.forEach(menuItem => {
            menuMap.set(menuItem.id, menuItem);
        });

        const validItems = [];
        const unavailableItems = [];
        const priceChanges = [];

        orderItems.forEach(orderItem => {
            const menuItem = menuMap.get(orderItem.menuItemId);

            if (!menuItem) {
                // Item no longer exists
                unavailableItems.push({
                    ...orderItem,
                    reason: 'Item no longer available'
                });
                return;
            }

            if (!menuItem.isAvailable) {
                // Item exists but not available
                unavailableItems.push({
                    ...orderItem,
                    reason: 'Item currently unavailable'
                });
                return;
            }

            // Item is available - check for price change
            const oldPrice = orderItem.snapshotPrice || orderItem.price || 0;
            const newPrice = menuItem.price || 0;
            
            if (oldPrice !== newPrice) {
                priceChanges.push({
                    name: orderItem.snapshotName || menuItem.name,
                    oldPrice: oldPrice,
                    newPrice: newPrice,
                    quantity: orderItem.quantity
                });
            }

            // Validate add-ons
            const validAddOns = [];
            const unavailableAddOns = [];

            if (orderItem.addOns && orderItem.addOns.length > 0) {
                const addOnMap = new Map();
                if (menuItem.addOns) {
                    menuItem.addOns.forEach(addOn => {
                        addOnMap.set(addOn.name.toLowerCase(), addOn);
                    });
                }

                orderItem.addOns.forEach(orderAddOn => {
                    const currentAddOn = addOnMap.get(orderAddOn.name?.toLowerCase());
                    
                    if (currentAddOn && currentAddOn.isAvailable) {
                        validAddOns.push({
                            id: currentAddOn.id,
                            name: currentAddOn.name,
                            price: currentAddOn.price
                        });
                    } else {
                        unavailableAddOns.push(orderAddOn);
                    }
                });
            }

            // Add to valid items with current price
            validItems.push({
                menuItemId: menuItem.id,
                name: menuItem.name,
                price: newPrice,
                unitPrice: newPrice,
                quantity: orderItem.quantity,
                customizations: orderItem.customizations || {},
                addons: validAddOns,
                timestamp: new Date().toISOString(),
                originalPrice: oldPrice,
                priceChanged: oldPrice !== newPrice
            });
        });

        return {
            validItems,
            unavailableItems,
            priceChanges
        };
    }

    /**
     * Calculate total for validated items
     */
    function calculateTotal(items) {
        return items.reduce((sum, item) => {
            const itemTotal = item.price * item.quantity;
            const addOnsTotal = item.addons?.reduce((addOnSum, addOn) => addOnSum + addOn.price, 0) || 0;
            return sum + itemTotal + (addOnsTotal * item.quantity);
        }, 0);
    }

    /**
     * Prepare reorder review data
     */
    async function prepareReorderReview(order) {
        const validation = await validateOrderItems(order.items);
        
        const newTotal = calculateTotal(validation.validItems);
        const oldTotal = order.total || order.grandTotal || 0;

        return {
            orderId: order.id,
            orderNumber: order.orderNumber,
            validItems: validation.validItems,
            unavailableItems: validation.unavailableItems,
            priceChanges: validation.priceChanges,
            newTotal: newTotal,
            oldTotal: oldTotal,
            totalChanged: newTotal !== oldTotal,
            hasUnavailableItems: validation.unavailableItems.length > 0,
            allUnavailable: validation.validItems.length === 0
        };
    }

    // Public API
    return {
        validateOrderItems,
        prepareReorderReview,
        fetchCurrentMenu
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReorderService;
}
