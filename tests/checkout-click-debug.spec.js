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

test('debug button click in detail', async ({ page, context }) => {
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

    // Mock MenuAPI
    await page.route('**/api/menu', (route) => {
        route.fulfill({
            status: 200,
            body: JSON.stringify([
                {
                    id: "loaded-fries-001",
                    name: "Loaded Fries",
                    price: 25,
                    isAvailable: true,
                    addOns: [
                        { id: "extra-cheese", name: "Extra Cheese", price: 2 }
                    ]
                }
            ])
        });
    });

    // Intercept WhatsApp
    let whatsappUrl = null;
    context.route('https://api.whatsapp.com/**', (route) => {
        whatsappUrl = route.request().url();
        console.log('WhatsApp intercepted:', whatsappUrl);
        route.abort();
    });

    // Fill in details
    await page.fill('#fullName', 'Test Customer');
    await page.fill('#phoneNumber', '0500000000');

    // Check button state in detail
    const buttonState = await page.evaluate(() => {
        const button = document.getElementById('placeOrderBtn');
        const form = document.getElementById('checkoutForm');

        return {
            buttonExists: !!button,
            buttonDisabled: button ? button.disabled : null,
            buttonType: button ? button.type : null,
            buttonText: button ? button.textContent : null,
            formExists: !!form,
            formMethod: form ? form.method : null,
            formAction: form ? form.action : null,
            formBound: form ? form.dataset.bound : null,
            pointerEvents: button ? window.getComputedStyle(button).pointerEvents : null,
            zIndex: button ? window.getComputedStyle(button).zIndex : null,
            position: button ? window.getComputedStyle(button).position : null,
            opacity: button ? window.getComputedStyle(button).opacity : null,
            visibility: button ? window.getComputedStyle(button).visibility : null,
            display: button ? window.getComputedStyle(button).display : null
        };
    });

    console.log('Button state:', JSON.stringify(buttonState, null, 2));

    // Check for overlays
    const overlays = await page.evaluate(() => {
        const overlays = [];
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed' || style.position === 'absolute') {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    overlays.push({
                        tag: el.tagName,
                        id: el.id,
                        class: el.className,
                        zIndex: style.zIndex,
                        position: style.position,
                        rect: {
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height
                        }
                    });
                }
            }
        });
        return overlays;
    });

    console.log('Overlays:', JSON.stringify(overlays, null, 2));

    // Try clicking with detailed error capture
    try {
        const button = page.locator('#placeOrderBtn');
        await button.click({ timeout: 5000 });
        console.log('Button click succeeded');
    } catch (error) {
        console.log('Button click error:', error.message);
    }

    // Wait for processing
    await page.waitForTimeout(5000);

    console.log('WhatsApp URL:', whatsappUrl);

    // Check if form was submitted
    const formSubmitted = await page.evaluate(() => {
        const form = document.getElementById('checkoutForm');
        return form ? form.dataset.submitted : null;
    });

    console.log('Form submitted:', formSubmitted);

    expect(whatsappUrl).toBeTruthy();
});
