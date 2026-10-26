'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateFrontendConfig } = require('../scripts/prepare-deployment.js');

const stagingConfig = {
    APP_ENV: 'staging',
    API_BASE_URL: 'https://crave-backend-staging.onrender.com',
    APP_URL: 'https://crave-staging.vercel.app',
    PAYMENT_MODE: 'test',
    PAYSTACK_PUBLIC_KEY: 'pk_test_PUBLICKEY123'
};

test('accepts an isolated staging host and Paystack test key', () => {
    assert.equal(validateFrontendConfig(stagingConfig).APP_ENV, 'staging');
});

test('rejects a production API host in staging', () => {
    assert.throws(() => validateFrontendConfig({
        ...stagingConfig,
        API_BASE_URL: 'https://crave-backend-oie3.onrender.com'
    }), /never production/);
});

test('rejects missing or live Paystack keys in staging', () => {
    assert.throws(() => validateFrontendConfig({
        ...stagingConfig,
        PAYSTACK_PUBLIC_KEY: 'pk_test_xxxxxxxxxxxxxxxx'
    }), /valid Paystack pk_test_/);
    assert.throws(() => validateFrontendConfig({
        ...stagingConfig,
        PAYSTACK_PUBLIC_KEY: 'pk_live_LIVEKEY123',
        PAYMENT_MODE: 'live'
    }), /PAYMENT_MODE=test/);
});

test('rejects staging API hosts that do not identify as staging', () => {
    assert.throws(() => validateFrontendConfig({
        ...stagingConfig,
        API_BASE_URL: 'https://crave-backend.onrender.com'
    }), /dedicated staging host/);
});

test('accepts the configured Vercel production alias', () => {
    assert.equal(validateFrontendConfig({
        APP_ENV: 'production',
        API_BASE_URL: 'https://crave-backend-oie3.onrender.com',
        APP_URL: 'https://crave.vercel.app',
        PAYMENT_MODE: 'live',
        PAYSTACK_PUBLIC_KEY: 'pk_live_PUBLICKEY123'
    }).APP_URL, 'https://crave.vercel.app');
});

test('production build validation rejects a missing or test-mode public key', () => {
    const productionConfig = {
        APP_ENV: 'production',
        API_BASE_URL: 'https://crave-backend-oie3.onrender.com',
        APP_URL: 'https://www.craveghana.com',
        PAYMENT_MODE: 'live'
    };
    assert.throws(() => validateFrontendConfig(productionConfig), /valid Paystack pk_live_/);
    assert.throws(() => validateFrontendConfig({
        ...productionConfig,
        PAYSTACK_PUBLIC_KEY: 'pk_test_PUBLICKEY123'
    }), /valid Paystack pk_live_/);
});

test('Vercel runs fail-closed configuration validation during build', () => {
    const vercelConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../vercel.json'), 'utf8'));
    assert.equal(vercelConfig.buildCommand, 'node scripts/prepare-deployment.js --write');
    assert.equal(vercelConfig.outputDirectory, '.');

    const buildScript = fs.readFileSync(path.resolve(__dirname, '../scripts/prepare-deployment.js'), 'utf8');
    assert.doesNotMatch(buildScript, /PAYSTACK_SECRET_KEY|DATABASE_URL|JWT_SECRET/);
});
