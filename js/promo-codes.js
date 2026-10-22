/**
 * CRAVE Promo Code System
 * Simple promo code validation with backend and client-side fallback
 */

const CravePromoCodes = (function() {
    'use strict';

    const API_BASE = 'https://crave-backend-oie3.onrender.com/api';

    // Simple hardcoded promo codes (fallback if backend unavailable)
    const LOCAL_PROMO_CODES = {
        CORPERATE: {
            code: 'CORPERATE',
            discountType: 'PERCENTAGE',
            discountValue: 10,
            active: true,
        },
    };

    // Apply promo code to order (calls backend for validation)
    async function applyPromoCode(code, orderTotal, cartItems = []) {
        try {
            const response = await fetch(`${API_BASE}/simple-promo/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // If backend route not found, fall back to local validation
                if (response.status === 404 || data.error?.message?.includes('not found')) {
                    console.log('Backend route not found, using local validation');
                    return validateLocal(code, orderTotal);
                }
                return {
                    valid: false,
                    message: data.error || data.message || 'Invalid promo code',
                };
            }

            // Calculate discount amount from percentage
            let discountAmount = 0;
            if (data.discountType === 'PERCENTAGE') {
                discountAmount = orderTotal * (data.discountValue / 100);
            } else {
                discountAmount = data.discountValue;
            }

            return {
                valid: true,
                code: data.code,
                name: data.code, // Use code as name for simple implementation
                discount: discountAmount,
                discountType: data.discountType,
                discountValue: data.discountValue,
                expiresAt: data.expiresAt,
            };
        } catch (error) {
            console.error('Promo code validation error:', error);
            // Fallback to local validation on network error
            console.log('Network error, using local validation');
            return validateLocal(code, orderTotal);
        }
    }

    // Local validation fallback
    function validateLocal(code, orderTotal) {
        const promoCode = LOCAL_PROMO_CODES[code.toUpperCase()];

        if (!promoCode) {
            return {
                valid: false,
                message: 'Invalid promo code',
            };
        }

        if (!promoCode.active) {
            return {
                valid: false,
                message: 'Promo code is not active',
            };
        }

        // Calculate discount amount from percentage
        let discountAmount = 0;
        if (promoCode.discountType === 'PERCENTAGE') {
            discountAmount = orderTotal * (promoCode.discountValue / 100);
        } else {
            discountAmount = promoCode.discountValue;
        }

        return {
            valid: true,
            code: promoCode.code,
            name: promoCode.code,
            discount: discountAmount,
            discountType: promoCode.discountType,
            discountValue: promoCode.discountValue,
            expiresAt: null,
        };
    }

    // Validate promo code without applying
    async function validatePromoCode(code, orderTotal) {
        return await applyPromoCode(code, orderTotal, []);
    }

    // Format discount for display
    function formatDiscount(discount, type) {
        switch (type) {
            case 'PERCENTAGE':
                return `${discount}%`;
            case 'FIXED':
                return `GH₵${discount.toFixed(2)}`;
            default:
                return 'Discount';
        }
    }

    // Calculate final price with promo code
    function calculateFinalPrice(orderTotal, promoResult, deliveryFee = 0) {
        let finalTotal = orderTotal;
        let discount = promoResult.discount || 0;

        finalTotal = orderTotal - discount;

        return {
            originalTotal: orderTotal,
            discount: discount,
            finalTotal: Math.max(0, finalTotal),
            discountType: promoResult.discountType,
        };
    }

    // Public API
    return {
        apply: applyPromoCode,
        validate: validatePromoCode,
        formatDiscount: formatDiscount,
        calculateFinalPrice: calculateFinalPrice,
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CravePromoCodes;
}
