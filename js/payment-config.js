/**
 * CRAVE Payment Configuration
 * Environment-based configuration for Paystack
 */

const PaymentConfig = {
    paystack: {
        publicKey: typeof PAYSTACK_PUBLIC_KEY !== 'undefined' ? PAYSTACK_PUBLIC_KEY : 'pk_test_placeholder',
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
