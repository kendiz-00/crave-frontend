const test = require('node:test');
const assert = require('node:assert/strict');
const CartSync = require('../js/cart-sync.js');

test('serializes selected add-on IDs for the authenticated cart API', () => {
    const result = CartSync.serializeCart([{
        menuItemId: 'menu-item-id',
        quantity: 3,
        addons: [{ id: 'addon-id', name: 'Extra cheese', price: 1 }]
    }]);

    assert.deepEqual(result, [{
        menuItemId: 'menu-item-id',
        quantity: 3,
        addOns: [{ addOnId: 'addon-id', name: 'Extra cheese', price: 1 }]
    }]);
});

test('rejects local add-ons without a backend add-on ID', () => {
    assert.throws(() => CartSync.serializeCart([{
        menuItemId: 'menu-item-id',
        quantity: 1,
        addons: [{ name: 'Unmapped fallback add-on', price: 10 }]
    }]), /without an add-on ID/);
});

test('persists non-empty and empty carts through supported API endpoints', async () => {
    const calls = [];
    global.APIClient = {
        async post(path, body) {
            calls.push({ method: 'POST', path, body });
            return { success: true };
        },
        async delete(path) {
            calls.push({ method: 'DELETE', path });
            return { success: true };
        }
    };

    await CartSync.persistCart([{
        menuItemId: 'menu-item-id',
        name: 'Meal',
        quantity: 1,
        addons: []
    }]);
    await CartSync.persistCart([]);

    assert.deepEqual(calls.map(call => [call.method, call.path]), [
        ['POST', '/api/cart'],
        ['DELETE', '/api/cart']
    ]);
    delete global.APIClient;
});

test('refreshes cached add-on prices from the backend cart response', () => {
    const merged = CartSync.mergeCarts([{
        menuItemId: 'menu-item-id',
        name: 'Meal',
        quantity: 1,
        basePrice: 10,
        unitPrice: 11,
        addons: [{ addOnId: 'addon-id', name: 'Old cheese', price: 1 }]
    }], [{
        id: 'cart-item-id',
        menuItemId: 'menu-item-id',
        unitPrice: 10,
        quantity: 1,
        menuItem: { id: 'menu-item-id', name: 'Meal', price: 10, imageUrl: 'meal.jpg' },
        addOns: [{ addOnId: 'addon-id', name: 'Extra cheese', price: 7.5 }]
    }]);

    assert.equal(merged.length, 1);
    assert.equal(merged[0].addons[0].name, 'Extra cheese');
    assert.equal(merged[0].addons[0].price, 7.5);
    assert.equal(merged[0].unitPrice, 17.5);
});
