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

test('debug form submit event', async ({ page, context }) => {
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

    // Check form submission directly
    const formCheck = await page.evaluate(() => {
        const form = document.getElementById('checkoutForm');
        const button = document.getElementById('placeOrderBtn');

        // Check if button has bound attribute
        const bound = form ? form.dataset.bound : null;

        return {
            formExists: !!form,
            buttonExists: !!button,
            buttonDisabled: button ? button.disabled : null,
            formBound: bound,
            formMethod: form ? form.method : null,
            formAction: form ? form.action : null
        };
    });

    console.log('Form check:', formCheck);

    // Try clicking button directly with JavaScript
    const directClickResult = await page.evaluate(() => {
        const button = document.getElementById('placeOrderBtn');
        const form = document.getElementById('checkoutForm');

        // Track if submit fires
        let submitFired = false;
        form.addEventListener('submit', (e) => {
            console.log('[JS] Submit event fired');
            submitFired = true;
        });

        // Click button
        button.click();

        return { submitFired };
    });

    console.log('Direct click result:', directClickResult);

    // Try form.requestSubmit()
    const requestSubmitResult = await page.evaluate(() => {
        const form = document.getElementById('checkoutForm');

        let submitFired = false;
        form.addEventListener('submit', (e) => {
            console.log('[JS] Submit event fired from requestSubmit');
            submitFired = true;
        });

        form.requestSubmit();

        return { submitFired };
    });

    console.log('Request submit result:', requestSubmitResult);

    // Check if there are any hidden required fields
    const requiredFields = await page.evaluate(() => {
        const form = document.getElementById('checkoutForm');
        const inputs = form.querySelectorAll('input, select, textarea');
        const required = [];
        inputs.forEach(input => {
            if (input.required) {
                required.push({
                    name: input.name || input.id,
                    type: input.type,
                    value: input.value,
                    visible: input.offsetParent !== null
                });
            }
        });
        return required;
    });

    console.log('Required fields:', requiredFields);
});
