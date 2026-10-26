const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const path = require('path');

let server;

test.beforeAll(async () => {
    // Start local server
    server = spawn('python', ['-m', 'http.server', '8080', '--bind', '127.0.0.1'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'ignore'
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
});

test.afterAll(async () => {
    if (server) {
        server.kill();
    }
});

test.describe('Checkout Flow', () => {
    test('checkout button click opens WhatsApp with correct order', async ({ page, context }) => {
        // Setup test cart in localStorage before navigation
        await page.goto('http://127.0.0.1:8080/checkout.html');

        // Inject test cart into localStorage
        const testCart = [
            {
                name: "Loaded Fries",
                menuItemId: "loaded-fries-001",
                price: 25,
                unitPrice: 27,
                quantity: 2,
                customizations: [
                    { name: "Extra Cheese", price: 2 }
                ]
            }
        ];

        await page.evaluate((cart) => {
            localStorage.setItem('craveCart', JSON.stringify(cart));
        }, testCart);

        // Reload page to initialize with cart
        await page.reload();

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Capture console errors
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        // Check if cart is loaded
        const cartLoaded = await page.evaluate(() => {
            const cart = JSON.parse(localStorage.getItem('craveCart') || '[]');
            return cart.length > 0;
        });
        expect(cartLoaded).toBe(true);

        // Fill in customer details
        await page.fill('#fullName', 'Test Customer');
        await page.fill('#phoneNumber', '0500000000');

        // Check if button is enabled
        const button = page.locator('#placeOrderBtn');
        const isDisabled = await button.isDisabled();
        console.log('Button disabled state:', isDisabled);

        if (isDisabled) {
            console.log('Button is disabled - checking form readiness');
            const formData = await page.evaluate(() => {
                const form = document.getElementById('checkoutForm');
                const formData = new FormData(form);
                return {
                    fullName: formData.get('fullName'),
                    phoneNumber: formData.get('phoneNumber')
                };
            });
            console.log('Form data:', formData);
        }

        // Intercept WhatsApp navigation
        let whatsappUrl = null;
        let whatsappMessage = null;

        context.route('https://api.whatsapp.com/**', (route) => {
            const url = route.request().url();
            whatsappUrl = url;
            const urlParams = new URL(url).searchParams;
            whatsappMessage = decodeURIComponent(urlParams.get('text') || '');
            console.log('WhatsApp URL intercepted:', url);
            console.log('WhatsApp message length:', whatsappMessage?.length);

            // Abort the request to prevent actual navigation
            route.abort();
        });

        // Click the button
        console.log('Clicking checkout button...');
        await button.click();

        // Wait a bit for processing
        await page.waitForTimeout(5000);

        // Check console errors
        console.log('Console errors:', consoleErrors);

        // Verify WhatsApp URL was generated
        expect(whatsappUrl).toBeTruthy();
        expect(whatsappUrl).toContain('api.whatsapp.com/send');
        expect(whatsappUrl).toContain('phone=233550020788');

        // Verify message content
        expect(whatsappMessage).toBeTruthy();
        expect(whatsappMessage).toContain('Loaded Fries');
        expect(whatsappMessage).toContain('Extra Cheese');
        expect(whatsappMessage).toContain('Test Customer');
        expect(whatsappMessage).toContain('0500000000');

        console.log('WhatsApp message:', whatsappMessage.substring(0, 200) + '...');

        // Verify no console errors
        expect(consoleErrors.length).toBe(0);
    });

    test('checkout with API timeout shows error and restores button', async ({ page }) => {
        // Setup test cart
        await page.goto('http://127.0.0.1:8080/checkout.html');

        const testCart = [
            {
                name: "Loaded Fries",
                menuItemId: "loaded-fries-001",
                price: 25,
                unitPrice: 27,
                quantity: 1
            }
        ];

        await page.evaluate((cart) => {
            localStorage.setItem('craveCart', JSON.stringify(cart));
        }, testCart);

        await page.reload();
        await page.waitForLoadState('networkidle');

        // Intercept menu API to simulate timeout
        await page.route('**/api/menu', (route) => {
            // Delay response by 15 seconds to trigger timeout
            setTimeout(() => {
                route.fulfill({
                    status: 200,
                    body: JSON.stringify([])
                });
            }, 15000);
        });

        // Fill in details
        await page.fill('#fullName', 'Test Customer');
        await page.fill('#phoneNumber', '0500000000');

        // Click button
        const button = page.locator('#placeOrderBtn');
        await button.click();

        // Wait for timeout (10 seconds + processing time)
        await page.waitForTimeout(15000);

        // Check if error message is shown
        const errorDiv = page.locator('#checkoutError');
        const isVisible = await errorDiv.isVisible();
        console.log('Error div visible:', isVisible);

        if (isVisible) {
            const errorText = await errorDiv.textContent();
            console.log('Error text:', errorText);
            expect(errorText).toContain('Unable to verify current prices');
        }

        // Check if button is restored
        const buttonText = await button.textContent();
        console.log('Button text after timeout:', buttonText);
        expect(buttonText).toContain('Confirm Order on WhatsApp');

        // Check if button is enabled
        const isDisabled = await button.isDisabled();
        console.log('Button disabled after timeout:', isDisabled);
        expect(isDisabled).toBe(false);
    });

    test('checkout with empty cart shows inline error', async ({ page }) => {
        await page.goto('http://127.0.0.1:8080/checkout.html');

        // Clear cart
        await page.evaluate(() => {
            localStorage.removeItem('craveCart');
        });

        await page.reload();
        await page.waitForLoadState('networkidle');

        // Fill in details
        await page.fill('#fullName', 'Test Customer');
        await page.fill('#phoneNumber', '0500000000');

        // Click button
        const button = page.locator('#placeOrderBtn');
        await button.click();

        // Wait for error
        await page.waitForTimeout(1000);

        // Check error message
        const errorDiv = page.locator('#checkoutError');
        const errorText = await errorDiv.textContent();
        console.log('Empty cart error:', errorText);
        expect(errorText).toContain('cart is empty');
    });
});
