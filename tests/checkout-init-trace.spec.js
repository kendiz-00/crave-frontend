const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const path = require('path');

let server;

test.beforeAll(async () => {
    server = spawn('python', ['-m', 'http.server', '8080', '--bind', '127.0.0.1'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'ignore'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
});

test.afterAll(async () => {
    if (server) server.kill();
});

test('trace initialization', async ({ page }) => {
    await page.goto('http://127.0.0.1:8080/checkout.html');

    // Setup test cart
    const testCart = [
        {
            name: "Loaded Fries",
            menuItemId: "loaded-fries-001",
            price: 25,
            unitPrice: 27,
            quantity: 2,
            customizations: [{ name: "Extra Cheese", price: 2 }]
        }
    ];

    await page.evaluate((cart) => {
        localStorage.setItem('craveCart', JSON.stringify(cart));
    }, testCart);

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for initialization
    await page.waitForTimeout(500);

    // Check initialization state
    const initResult = await page.evaluate(() => {
        return {
            initializeCheckoutExists: typeof window.initializeCheckout === 'function',
            handleFormSubmitExists: typeof window.handleFormSubmit === 'function',
            processOrderExists: typeof window.processOrder === 'function',
            cartItems: window.cartItems,
            formBound: document.getElementById('checkoutForm')?.dataset.bound
        };
    });

    console.log('Init result:', initResult);
});
