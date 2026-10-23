/**
 * CRAVE Promo Code System
 * Simple promo code validation through backend API with local fallback
 */

const CravePromoCodes = (function() {
    'use strict';

    const API_BASE = 'https://crave-backend-oie3.onrender.com/api';

    // Temporary local fallback for CORPERATE (remove once backend is confirmed deployed)
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
        console.log('[PromoCode] Validating code:', code, 'for order total:', orderTotal);

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

            console.log('[PromoCode] Response status:', response.status);

            const data = await response.json();
            console.log('[PromoCode] Response data:', data);

            if (!response.ok) {
                console.log('[PromoCode] Backend validation failed, using local fallback');
                return validateLocal(code, orderTotal);
            }

            // Calculate discount amount from percentage
            let discountAmount = 0;
            if (data.discountType === 'PERCENTAGE') {
                discountAmount = orderTotal * (data.discountValue / 100);
            } else {
                discountAmount = data.discountValue;
            }

            console.log('[PromoCode] Discount calculated:', discountAmount);

            return {
                valid: true,
                code: data.code,
                name: data.code,
                discount: discountAmount,
                discountType: data.discountType,
                discountValue: data.discountValue,
                expiresAt: data.expiresAt,
            };
        } catch (error) {
            console.error('[PromoCode] Validation error:', error);
            console.log('[PromoCode] Network error, using local fallback');
            return validateLocal(code, orderTotal);
        }
    }

    // Local validation fallback (temporary)
    function validateLocal(code, orderTotal) {
        console.log('[PromoCode] Using local validation for:', code);
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

        let discountAmount = 0;
        if (promoCode.discountType === 'PERCENTAGE') {
            discountAmount = orderTotal * (promoCode.discountValue / 100);
        } else {
            discountAmount = promoCode.discountValue;
        }

        console.log('[PromoCode] Local discount calculated:', discountAmount);

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
