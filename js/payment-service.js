/**
 * CRAVE Payment Service
 * Handles Paystack integration for payments
 */

const PaymentService = (function() {
    'use strict';

    const config = typeof PaymentConfig !== 'undefined' ? PaymentConfig : null;

    /**
     * Initialize Paystack inline payment
     */
    async function initializePaystack(options) {
        if (!config || !config.paystack) {
            console.error('Payment config not available');
            return null;
        }

        if (!options.orderId || !options.amount) {
            throw new Error('Order ID and amount are required to initialize payment');
        }

        const initialization = await initializePayment(options);
        if (!initialization.success) {
            throw new Error(initialization.message || 'Payment initialization failed');
        }

        const paystackOptions = {
            key: config.paystack.publicKey,
            email: options.email,
            amount: Number(initialization.data.amount || options.amount) * 100,
            currency: config.paystack.currency,
            ref: initialization.data.reference,
            metadata: {
                custom_fields: [
                    {
                        display_name: 'Order ID',
                        variable_name: 'order_id',
                        value: options.orderId
                    },
                    {
                        display_name: 'Customer Name',
                        variable_name: 'customer_name',
                        value: options.customerName
                    }
                ]
            },
            callback: function(response) {
                handlePaymentSuccess(response, options);
            },
            onClose: function() {
                handlePaymentClose(options);
            },
            channels: config.paystack.channels
        };

        const handler = PaystackPop.setup(paystackOptions);
        handler.openIframe();

        return handler;
    }

    /**
     * Initialize the payment record for a created order.
     */
    async function initializePayment(options) {
        if (typeof APIClient === 'undefined') {
            return { success: false, message: 'API client not available' };
        }

        return APIClient.post('/api/payments/initialize', {
            orderId: options.orderId,
            email: options.email,
            amount: options.amount,
            method: options.method || 'MOBILE_MONEY'
        });
    }

    /**
     * Generate unique payment reference
     */
    function generateReference() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        return `CRAVE_${timestamp}_${random}`;
    }

    /**
     * Handle payment success
     */
    async function handlePaymentSuccess(response, options) {
        try {
            // Verify payment with backend
            const verification = await verifyPayment(response.reference);
            
            if (verification.success) {
                // The order was already created and linked to the claim before payment.
                if (options.onSuccess) {
                    options.onSuccess(response, verification);
                }
            } else {
                // Payment verification failed
                if (options.onError) {
                    options.onError('Payment verification failed');
                }
            }
        } catch (error) {
            console.error('Payment success handler error:', error);
            if (options.onError) {
                options.onError(error.message);
            }
        }
    }

    /**
     * Handle payment close
     */
    function handlePaymentClose(options) {
        if (options.onClose) {
            options.onClose();
        }
    }

    /**
     * Verify payment with backend
     */
    async function verifyPayment(reference) {
        try {
            if (typeof APIClient !== 'undefined') {
                const response = await APIClient.post('/api/payments/verify', { reference });
                return response;
            }
            return { success: false, message: 'API client not available' };
        } catch (error) {
            console.error('Payment verification error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Create a pending order before initializing payment.
     */
    async function createOrder(orderData) {
        try {
            if (typeof APIClient !== 'undefined') {
                const orderPayload = {
                    orderType: orderData.orderType,
                    items: orderData.items,
                    customerName: orderData.fullName,
                    customerPhone: orderData.phoneNumber,
                    customerEmail: orderData.customerEmail || orderData.phoneNumber,
                    deliveryAddress: orderData.deliveryAddress,
                    latitude: orderData.latitude,
                    longitude: orderData.longitude,
                    notes: orderData.additionalNotes,
                    rewardPointsUsed: orderData.rewardPointsUsed || 0,
                    claimedRewardId: orderData.claimedRewardId || null
                };
                const response = await APIClient.post('/api/orders', orderPayload);
                return response;
            }
            return { success: false, message: 'API client not available' };
        } catch (error) {
            console.error('Order creation error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Calculate order total
     */
    function calculateOrderTotal(items, deliveryFee = 0, taxRate = 0) {
        const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
        const tax = subtotal * (taxRate / 100);
        const total = subtotal + deliveryFee + tax;
        return {
            subtotal,
            tax,
            deliveryFee,
            total
        };
    }

    /**
     * Format amount for display
     */
    function formatAmount(amount) {
        return `GHS ${amount.toFixed(2)}`;
    }

    // Public API
    return {
        initializePaystack,
        verifyPayment,
        createOrder,
        calculateOrderTotal,
        formatAmount,
        generateReference
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentService;
}
