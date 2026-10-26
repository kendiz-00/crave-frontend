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

test('debug direct handler call', async ({ page, context }) => {
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

    // Intercept WhatsApp
    let whatsappUrl = null;
    context.route('https://api.whatsapp.com/**', (route) => {
        whatsappUrl = route.request().url();
        console.log('WhatsApp intercepted:', whatsappUrl);
        route.abort();
    });

    // Wait for DOMContentLoaded and initialization
    await page.waitForTimeout(1000);

    // Try to manually trigger the handler
    const directCallResult = await page.evaluate(() => {
        const form = document.getElementById('checkoutForm');
        const button = document.getElementById('placeOrderBtn');

        // Check if handleFormSubmit is available
        console.log('handleFormSubmit exists:', typeof window.handleFormSubmit);

        // Create a mock event
        const mockEvent = {
            preventDefault: () => {},
            target: form
        };

        // Try calling handleFormSubmit directly
        try {
            if (typeof window.handleFormSubmit === 'function') {
                window.handleFormSubmit(mockEvent);
                return { success: true, error: null };
            } else {
                return { success: false, error: 'handleFormSubmit not a function' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    console.log('Direct call result:', directCallResult);

    // Wait for processing
    await page.waitForTimeout(5000);

    console.log('WhatsApp URL:', whatsappUrl);

    expect(whatsappUrl).toBeTruthy();
});
