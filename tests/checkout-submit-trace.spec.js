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

test('trace submit event listener', async ({ page, context }) => {
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

    // Add a test submit listener
    await page.evaluate(() => {
        const form = document.getElementById('checkoutForm');
        window.testSubmitFired = false;
        window.testDefaultPrevented = false;

        form.addEventListener('submit', (e) => {
            window.testSubmitFired = true;
            window.testDefaultPrevented = e.defaultPrevented;
            console.log('[TEST] Submit event fired, defaultPrevented:', e.defaultPrevented);
        }, true); // Use capture to catch all submit events
    });

    // Click button
    const button = page.locator('#placeOrderBtn');
    await button.click();

    // Wait
    await page.waitForTimeout(2000);

    // Check if submit fired
    const submitResult = await page.evaluate(() => {
        return {
            fired: window.testSubmitFired || false,
            defaultPrevented: window.testDefaultPrevented || false
        };
    });

    console.log('Submit result:', submitResult);

    // Check if handleFormSubmit exists and is a function
    const handlerCheck = await page.evaluate(() => {
        return {
            handleFormSubmitExists: typeof window.handleFormSubmit === 'function',
            handleFormSubmitString: window.handleFormSubmit ? window.handleFormSubmit.toString().substring(0, 200) : null
        };
    });

    console.log('Handler check:', handlerCheck);

    // Try manually triggering submit event
    const manualSubmit = await page.evaluate(() => {
        const form = document.getElementById('checkoutForm');
        const event = new Event('submit', { bubbles: true, cancelable: true });
        return form.dispatchEvent(event);
    });

    console.log('Manual submit dispatched:', manualSubmit);

    await page.waitForTimeout(2000);
});
