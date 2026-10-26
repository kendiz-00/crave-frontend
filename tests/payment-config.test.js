'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.resolve(__dirname, '../js/payment-config.js'), 'utf8');

function loadPaymentConfig(environment) {
    const context = {
        window: { ENV: environment },
        console
    };
    vm.runInNewContext(`${source}\nglobalThis.__paymentConfig = PaymentConfig;`, context);
    return context.__paymentConfig;
}

test('missing production public key disables payment without fallback credentials', () => {
    const config = loadPaymentConfig({ APP_ENV: 'production', PAYMENT_MODE: 'live' });
    assert.equal(config.paystack.enabled, false);
    assert.equal(config.paystack.publicKey, undefined);
});

test('test-mode public key is rejected by production payment configuration', () => {
    assert.throws(() => loadPaymentConfig({
        APP_ENV: 'production',
        PAYMENT_MODE: 'live',
        PAYSTACK_PUBLIC_KEY: 'pk_test_PUBLICKEY123'
    }), /must use pk_live_/);
});
