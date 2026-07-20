/**
 * CRAVE Promo Code System
 * Complete coupon engine with validation and application
 */

const CravePromoCodes = (function() {
    'use strict';

    const config = typeof CraveRewardsConfig !== 'undefined' ? CraveRewardsConfig : null;
    const engine = typeof CraveRewardsEngine !== 'undefined' ? CraveRewardsEngine : null;
    const notifications = typeof CraveRewardsNotifications !== 'undefined' ? CraveRewardsNotifications : null;

    // Apply promo code to order
    function applyPromoCode(code, orderTotal, cartItems = []) {
        if (!engine) {
            return { valid: false, message: 'Rewards system not available' };
        }

        const result = engine.applyPromoCode(code, orderTotal, cartItems);
        
        if (result.valid) {
            if (notifications) {
                notifications.promoCodeApplied(code, result.discount);
            }
        } else {
            if (notifications) {
                notifications.promoCodeInvalid(result.message);
            }
        }
        
        return result;
    }

    // Validate promo code without applying
    function validatePromoCode(code, orderTotal) {
        if (!engine) {
            return { valid: false, message: 'Rewards system not available' };
        }
        
        return engine.applyPromoCode(code, orderTotal, []);
    }

    // Get available promo codes for current user
    function getAvailablePromoCodes() {
        if (!config) return [];
        
        const available = [];
        
        for (const [code, promoConfig] of Object.entries(config.promoCodes)) {
            let isAvailable = true;
            let reason = '';
            
            // Check new customer restriction
            if (promoConfig.newCustomerOnly) {
                const orders = typeof CraveRewardsData !== 'undefined' ? CraveRewardsData.Orders.getCount() : 0;
                if (orders > 0) {
                    isAvailable = false;
                    reason = 'New customers only';
                }
            }
            
            // Check tier restriction
            if (promoConfig.tierRestriction) {
                const tier = typeof CraveRewardsData !== 'undefined' ? CraveRewardsData.Tier.get() : 'bronze';
                if (!promoConfig.tierRestriction.includes(tier)) {
                    isAvailable = false;
                    reason = `Requires ${promoConfig.tierRestriction.join(' or ')} tier`;
                }
            }
            
            // Check minimum orders
            if (promoConfig.minOrders) {
                const orders = typeof CraveRewardsData !== 'undefined' ? CraveRewardsData.Orders.getCount() : 0;
                if (orders < promoConfig.minOrders) {
                    isAvailable = false;
                    reason = `Requires ${promoConfig.minOrders} orders`;
                }
            }
            
            available.push({
                code,
                ...promoConfig,
                available: isAvailable,
                reason
            });
        }
        
        return available;
    }

    // Get promo code details
    function getPromoCodeDetails(code) {
        if (!config) return null;
        
        const promoCode = code.toUpperCase();
        return config.promoCodes[promoCode] || null;
    }

    // Format discount for display
    function formatDiscount(discount, type) {
        switch (type) {
            case 'percentage':
                return `${discount}%`;
            case 'fixed':
                return `GHS ${discount.toFixed(2)}`;
            case 'free_delivery':
                return 'Free Delivery';
            case 'free_item':
                return 'Free Item';
            default:
                return 'Discount';
        }
    }

    // Calculate final price with promo code
    function calculateFinalPrice(orderTotal, promoResult, deliveryFee = 0) {
        let finalTotal = orderTotal;
        let discount = promoResult.discount || 0;
        
        if (promoResult.discountType === 'free_delivery') {
            discount = deliveryFee;
        }
        
        finalTotal = orderTotal - discount;
        
        return {
            originalTotal: orderTotal,
            discount: discount,
            finalTotal: Math.max(0, finalTotal),
            discountType: promoResult.discountType
        };
    }

    // Check if promo code is currently valid (time/day restrictions)
    function isPromoCodeCurrentlyValid(code) {
        if (!config) return false;
        
        const promoConfig = config.promoCodes[code.toUpperCase()];
        if (!promoConfig) return false;
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay();
        
        // Check time restriction
        if (promoConfig.timeRestriction) {
            const startHour = parseInt(promoConfig.timeRestriction.start.split(':')[0]);
            const endHour = parseInt(promoConfig.timeRestriction.end.split(':')[0]);
            
            if (currentHour < startHour || currentHour >= endHour) {
                return false;
            }
        }
        
        // Check day restriction
        if (promoConfig.dayRestriction) {
            if (!promoConfig.dayRestriction.includes(currentDay)) {
                return false;
            }
        }
        
        return true;
    }

    // Get active promo codes based on time/day
    function getActivePromoCodes() {
        if (!config) return [];
        
        const active = [];
        
        for (const [code, promoConfig] of Object.entries(config.promoCodes)) {
            if (isPromoCodeCurrentlyValid(code)) {
                active.push({
                    code,
                    ...promoConfig
                });
            }
        }
        
        return active;
    }

    // Public API
    return {
        apply: applyPromoCode,
        validate: validatePromoCode,
        getAvailable: getAvailablePromoCodes,
        getDetails: getPromoCodeDetails,
        formatDiscount: formatDiscount,
        calculateFinalPrice: calculateFinalPrice,
        isCurrentlyValid: isPromoCodeCurrentlyValid,
        getActive: getActivePromoCodes
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CravePromoCodes;
}
