/**
 * CRAVE Payment Configuration
 * Environment-based configuration for Paystack
 */

// Get Paystack public key from environment variable or use default
const PAYSTACK_PUBLIC_KEY = window.ENV?.PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder';

const PaymentConfig = {
    paystack: {
        publicKey: PAYSTACK_PUBLIC_KEY,
        currency: 'GHS',
        channels: ['card', 'mobile_money', 'bank_transfer']
    },
    
    // Payment methods supported
    methods: {
        card: { name: 'Card', icon: 'fa-credit-card' },
        mobileMoney: { name: 'Mobile Money', icon: 'fa-mobile-alt' },
        bankTransfer: { name: 'Bank Transfer', icon: 'fa-university' }
    }
};
