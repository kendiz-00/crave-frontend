'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PRODUCTION_API_HOST = 'crave-backend-oie3.onrender.com';
const PRODUCTION_FRONTEND_HOSTS = new Set([
    'craveghana.com',
    'www.craveghana.com',
    'crave.com',
    'www.crave.com',
    'crave-frontend.vercel.app',
    'crave.vercel.app'
]);
const GENERATED_CONFIG_START = '/* CRAVE DEPLOYMENT CONFIG START */\n';
const GENERATED_CONFIG_END = '/* CRAVE DEPLOYMENT CONFIG END */\n';

function parseOrigin(value, name) {
    let url;
    try {
        url = new URL(value);
    } catch {
        throw new Error(`${name} must be a valid origin URL.`);
    }
    if (url.protocol !== 'https:' || url.username || url.password ||
        (url.pathname && url.pathname !== '/') || url.search || url.hash) {
        throw new Error(`${name} must be an HTTPS origin without credentials, path, query, or fragment.`);
    }
    return url;
}

function isUsablePublicKey(key, mode) {
    const prefix = mode === 'live' ? 'pk_live_' : 'pk_test_';
    const suffix = String(key || '').slice(prefix.length);
    return String(key || '').startsWith(prefix) &&
        /^[A-Za-z0-9]+$/.test(suffix) &&
        !/^(x+|replace|placeholder|example)/i.test(suffix);
}

function validateFrontendConfig(config) {
    const appEnv = config.APP_ENV;
    if (appEnv !== 'staging' && appEnv !== 'production') {
        throw new Error('APP_ENV must be explicitly set to staging or production for a Vercel deployment.');
    }

    const apiUrl = parseOrigin(config.API_BASE_URL, 'API_BASE_URL');
    const appUrl = parseOrigin(config.APP_URL, 'APP_URL');
    const key = config.PAYSTACK_PUBLIC_KEY || '';
    const mode = config.PAYMENT_MODE;

    if (appEnv === 'staging') {
        if (!apiUrl.hostname.includes('staging') || !apiUrl.hostname.endsWith('.onrender.com') ||
            apiUrl.hostname === PRODUCTION_API_HOST) {
            throw new Error('Staging API_BASE_URL must use a dedicated staging host, never production.');
        }
        if (!appUrl.hostname.includes('staging')) {
            throw new Error('Staging APP_URL must use a dedicated staging hostname.');
        }
        if (mode !== 'test' || !isUsablePublicKey(key, 'test')) {
            throw new Error('Staging requires PAYMENT_MODE=test and a valid Paystack pk_test_ public key.');
        }
    } else {
        if (apiUrl.hostname !== PRODUCTION_API_HOST) {
            throw new Error('Production API_BASE_URL must match the approved production API host.');
        }
        if (!PRODUCTION_FRONTEND_HOSTS.has(appUrl.hostname)) {
            throw new Error('Production APP_URL must match an approved production frontend hostname.');
        }
        if (mode !== 'live' || !isUsablePublicKey(key, 'live')) {
            throw new Error('Production requires PAYMENT_MODE=live and a valid Paystack pk_live_ public key.');
        }
    }

    return {
        APP_ENV: appEnv,
        API_BASE_URL: apiUrl.origin,
        APP_URL: appUrl.origin,
        PAYMENT_MODE: mode,
        PAYSTACK_PUBLIC_KEY: key
    };
}

function writeDeploymentConfig(frontendRoot, config) {
    const envPath = path.join(frontendRoot, 'js', 'env.js');
    const source = fs.readFileSync(envPath, 'utf8');
    const start = source.indexOf(GENERATED_CONFIG_START);
    const end = source.indexOf(GENERATED_CONFIG_END);
    const cleanSource = start >= 0 && end >= start
        ? source.slice(0, start) + source.slice(end + GENERATED_CONFIG_END.length)
        : source;
    const injection = `${GENERATED_CONFIG_START}window.ENV = Object.freeze(${JSON.stringify(config)});\n${GENERATED_CONFIG_END}`;
    fs.writeFileSync(envPath, injection + cleanSource, 'utf8');
}

if (require.main === module) {
    try {
        const config = validateFrontendConfig({
            APP_ENV: process.env.APP_ENV,
            API_BASE_URL: process.env.API_BASE_URL,
            APP_URL: process.env.APP_URL,
            PAYMENT_MODE: process.env.PAYMENT_MODE,
            PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY
        });
        if (process.argv.includes('--write')) {
            writeDeploymentConfig(path.resolve(__dirname, '..'), config);
            console.log(`Validated ${config.APP_ENV} frontend deployment configuration and generated runtime config.`);
        } else {
            console.log(`Validated ${config.APP_ENV} frontend deployment configuration. Pass --write to generate the runtime config.`);
        }
    } catch (error) {
        console.error(`[CRAVE DEPLOYMENT CONFIG ERROR] ${error.message}`);
        process.exitCode = 1;
    }
}

module.exports = { validateFrontendConfig, writeDeploymentConfig, isUsablePublicKey };
