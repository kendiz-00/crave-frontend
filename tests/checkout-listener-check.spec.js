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

test('check if listener is actually attached', async ({ page }) => {
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
    await page.waitForTimeout(500);

    // Manually call initializeCheckout to re-attach listener
    await page.evaluate(() => {
        const form = document.getElementById('checkoutForm');
        if (form) {
            form.dataset.bound = ''; // Reset bound flag
            console.log('Reset form bound flag');
        }
    });

    // Call initializeCheckout
    await page.evaluate(() => {
        if (typeof window.initializeCheckout === 'function') {
            window.initializeCheckout();
            console.log('Called initializeCheckout');
        }
    });

    await page.waitForTimeout(500);

    // Check if listener is attached
    const listenerCheck = await page.evaluate(() => {
        const form = document.getElementById('checkoutForm');
        return {
            formBound: form?.dataset.bound,
            handleFormSubmitExists: typeof window.handleFormSubmit === 'function'
        };
    });

    console.log('Listener check:', listenerCheck);
});
