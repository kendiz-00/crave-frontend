const test = require('node:test');
const assert = require('node:assert/strict');

global.PaymentConfig = {
    paystack: {
        publicKey: 'pk_test_0123456789abcdef',
        enabled: true,
        mode: 'test',
        currency: 'GHS',
        channels: ['card']
    }
};

const calls = [];
global.APIClient = {
    async get(path, options) {
        calls.push({ method: 'GET', path, options });
        return {
            success: true,
            data: [{
                id: 'current-menu-item-id',
                name: 'Test meal',
                addOns: [{ id: 'current-addon-id', name: 'Extra cheese', price: 7.5 }]
            }]
        };
    },
    async post(path, body) {
        calls.push({ path, body });
        if (path === '/api/cart') return { success: true, data: {} };
        if (path === '/api/orders') {
            return { success: true, data: { id: 'server-order-id', grandTotal: 105 } };
        }
        if (path === '/api/payments/initialize') {
            return { success: true, data: { amount: 105, reference: 'test-reference' } };
        }
        throw new Error(`Unexpected endpoint: ${path}`);
    }
};

let paystackOptions;
global.PaystackPop = {
    setup(options) {
        paystackOptions = options;
        return { openIframe() {} };
    }
};

const PaymentService = require('../js/payment-service.js');

test('syncs product/add-on IDs before creating an order from priced cart data', async () => {
    calls.length = 0;
    const result = await PaymentService.createOrder({
        orderType: 'DELIVERY',
        fullName: 'Test Customer',
        phoneNumber: '+233550000000',
        items: [{
            menuItemId: 'menu-item-id',
            name: 'Test meal',
            quantity: 2,
            addons: [{ addOnId: 'addon-id', name: 'Extra cheese', price: 1 }]
        }],
        total: 100
    });

    assert.equal(result.success, true);
    assert.deepEqual(calls.slice(0, 2).map(call => call.path), ['/api/cart', '/api/orders']);
    assert.equal(calls[0].body.items[0].addOns[0].addOnId, 'addon-id');
    assert.equal(calls[1].body.items[0].menuItemId, 'menu-item-id');
    assert.equal(calls[1].body.items[0].addOns[0].addOnId, 'addon-id');
    assert.equal('total' in calls[1].body, false);
});

test('resolves old fallback cart entries to current backend IDs and add-on prices', async () => {
    calls.length = 0;
    const result = await PaymentService.createOrder({
        orderType: 'DELIVERY',
        fullName: 'Test Customer',
        phoneNumber: '+233550000000',
        items: [{
            name: 'Test meal',
            quantity: 1,
            addons: [{ name: 'Extra cheese', price: 1 }]
        }]
    });

    assert.equal(result.success, true);
    assert.equal(calls[0].path, '/api/menu');
    assert.equal(calls[1].path, '/api/cart');
    assert.equal(calls[1].body.items[0].menuItemId, 'current-menu-item-id');
    assert.deepEqual(calls[1].body.items[0].addOns, [{
        addOnId: 'current-addon-id',
        name: 'Extra cheese',
        price: 7.5
    }]);
});

test('initializes Paystack from the server-created grand total, not a local subtotal', async () => {
    calls.length = 0;
    await PaymentService.initializePaystack({
        orderId: 'server-order-id',
        email: 'test@example.com',
        amount: 100,
        serverAmount: 105
    });

    const initialization = calls.find(call => call.path === '/api/payments/initialize');
    assert.equal(initialization.body.amount, 105);
    assert.equal(paystackOptions.amount, 10500);
});

test('refuses payment initialization when the required public key is missing', async () => {
    calls.length = 0;
    const originalEnabled = global.PaymentConfig.paystack.enabled;
    const originalPublicKey = global.PaymentConfig.paystack.publicKey;
    global.PaymentConfig.paystack.enabled = false;
    global.PaymentConfig.paystack.publicKey = undefined;

    try {
        await assert.rejects(
            PaymentService.initializePaystack({
                orderId: 'server-order-id',
                email: 'test@example.com',
                serverAmount: 105
            }),
            /payment is disabled/
        );
        assert.equal(calls.length, 0);
    } finally {
        global.PaymentConfig.paystack.enabled = originalEnabled;
        global.PaymentConfig.paystack.publicKey = originalPublicKey;
    }
});
