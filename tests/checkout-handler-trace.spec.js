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

test('trace handleFormSubmit execution', async ({ page, context }) => {
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

    // Fill in details
    await page.fill('#fullName', 'Test Customer');
    await page.fill('#phoneNumber', '0500000000');

    // Wrap handleFormSubmit to trace execution
    await page.evaluate(() => {
        window.handleFormSubmitCalled = false;
        window.handleFormSubmitArgs = null;

        const originalHandleFormSubmit = window.handleFormSubmit;
        if (originalHandleFormSubmit) {
            window.handleFormSubmit = function(e) {
                window.handleFormSubmitCalled = true;
                window.handleFormSubmitArgs = {
                    event: e.type,
                    defaultPrevented: e.defaultPrevented,
                    target: e.target ? e.target.id : null
                };
                console.log('[TRACE] handleFormSubmit called with:', e);
                return originalHandleFormSubmit.apply(this, arguments);
            };
        }
    });

    // Click button
    const button = page.locator('#placeOrderBtn');
    await button.click();

    // Wait
    await page.waitForTimeout(2000);

    // Check if handleFormSubmit was called
    const traceResult = await page.evaluate(() => {
        return {
            handleFormSubmitCalled: window.handleFormSubmitCalled,
            handleFormSubmitArgs: window.handleFormSubmitArgs
        };
    });

    console.log('Trace result:', traceResult);

    // Check form attributes
    const formInfo = await page.evaluate(() => {
        const form = document.getElementById('checkoutForm');
        return {
            method: form.method,
            action: form.action,
            bound: form.dataset.bound
        };
    });

    console.log('Form info:', formInfo);
});
