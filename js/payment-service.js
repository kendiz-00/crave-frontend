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
    function initializePaystack(options) {
        if (!config || !config.paystack) {
            console.error('Payment config not available');
            return null;
        }

        const paystackOptions = {
            key: config.paystack.publicKey,
            email: options.email,
            amount: options.amount * 100, // Paystack expects amount in kobo/cents
            currency: config.paystack.currency,
            ref: generateReference(),
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
                // Create order with payment
                await createOrder({
                    ...options.orderData,
                    paymentReference: response.reference,
                    paymentMethod: 'paystack',
                    paymentStatus: 'paid'
                });

                // Show success and redirect
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
                const response = await APIClient.post('/payments/verify', { reference });
                return response;
            }
            return { success: false, message: 'API client not available' };
        } catch (error) {
            console.error('Payment verification error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Create order after successful payment
     */
    async function createOrder(orderData) {
        try {
            if (typeof APIClient !== 'undefined') {
                const response = await APIClient.post('/orders', orderData);
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
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
