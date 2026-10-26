'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'env.js'), 'utf8');

function loadEnvironment(hostname, env) {
    const window = {
        location: {
            hostname,
            origin: `https://${hostname}`
        }
    };
    if (env !== undefined) window.ENV = env;
    vm.runInNewContext(source, {
        window,
        URL,
        console: { error() {} }
    });
    return window;
}

test('fails closed on a staging host with missing API configuration', () => {
    assert.throws(() => loadEnvironment('crave-staging.vercel.app'), /API_BASE_URL/);
});

test('never substitutes the production API for a missing staging API', () => {
    let window;
    try {
        window = loadEnvironment('crave-staging.vercel.app');
    } catch (error) {
        assert.match(error.message, /API_BASE_URL/);
    }
    assert.equal(window && window.ENV && window.ENV.API_BASE_URL, undefined);
});

test('accepts an explicit staging API and Paystack test public key', () => {
    const window = loadEnvironment('crave-staging.vercel.app', {
        APP_ENV: 'staging',
        API_BASE_URL: 'https://crave-backend-staging.onrender.com',
        APP_URL: 'https://crave-staging.vercel.app',
        PAYMENT_MODE: 'test',
        PAYSTACK_PUBLIC_KEY: 'pk_test_PUBLICKEY123'
    });
    assert.equal(window.ENV.API_BASE_URL, 'https://crave-backend-staging.onrender.com');
});

test('rejects placeholder Paystack keys in staging', () => {
    assert.throws(() => loadEnvironment('crave-staging.vercel.app', {
        APP_ENV: 'staging',
        API_BASE_URL: 'https://crave-backend-staging.onrender.com',
        APP_URL: 'https://crave-staging.vercel.app',
        PAYMENT_MODE: 'test',
        PAYSTACK_PUBLIC_KEY: 'pk_test_xxxxxxxxxxxxxxxx'
    }), /valid Paystack pk_test_/);
});

test('rejects production API and live key configuration on a staging host', () => {
    assert.throws(() => loadEnvironment('crave-staging.vercel.app', {
        APP_ENV: 'staging',
        API_BASE_URL: 'https://crave-backend-oie3.onrender.com',
        APP_URL: 'https://crave-staging.vercel.app',
        PAYMENT_MODE: 'test',
        PAYSTACK_PUBLIC_KEY: 'pk_test_PUBLICKEY123'
    }), /dedicated staging backend/);
    assert.throws(() => loadEnvironment('crave-staging.vercel.app', {
        APP_ENV: 'staging',
        API_BASE_URL: 'https://crave-backend-staging.onrender.com',
        APP_URL: 'https://crave-staging.vercel.app',
        PAYMENT_MODE: 'live',
        PAYSTACK_PUBLIC_KEY: 'pk_live_LIVEKEY123'
    }), /PAYMENT_MODE=test/);
});

test('keeps the known production API fallback but rejects a test key in production', () => {
    const window = loadEnvironment('craveghana.com');
    assert.equal(window.ENV.API_BASE_URL, 'https://crave-backend-oie3.onrender.com');
    assert.throws(() => loadEnvironment('craveghana.com', {
        APP_ENV: 'production',
        API_BASE_URL: 'https://crave-backend-oie3.onrender.com',
        APP_URL: 'https://craveghana.com',
        PAYMENT_MODE: 'test',
        PAYSTACK_PUBLIC_KEY: 'pk_test_PUBLICKEY123'
    }), /PAYMENT_MODE=live/);
});

test('allows production aliases while restricting APP_URL to approved production hosts', () => {
    const window = loadEnvironment('www.craveghana.com', {
        APP_ENV: 'production',
        API_BASE_URL: 'https://crave-backend-oie3.onrender.com',
        APP_URL: 'https://craveghana.com',
        PAYMENT_MODE: 'live',
        PAYSTACK_PUBLIC_KEY: 'pk_live_PUBLICKEY123'
    });
    assert.equal(window.ENV.APP_URL, 'https://craveghana.com');
});

test('routes the configured Vercel production alias to the approved production API', () => {
    const window = loadEnvironment('crave.vercel.app', {
        APP_ENV: 'production',
        API_BASE_URL: 'https://crave-backend-oie3.onrender.com',
        APP_URL: 'https://crave.vercel.app',
        PAYMENT_MODE: 'live',
        PAYSTACK_PUBLIC_KEY: 'pk_live_PUBLICKEY123'
    });
    assert.equal(window.ENV.API_BASE_URL, 'https://crave-backend-oie3.onrender.com');
});
