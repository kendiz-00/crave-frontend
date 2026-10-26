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

test('trace handleFormSubmit execution path', async ({ page, context }) => {
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

    // Select Pickup to avoid delivery coordinates requirement
    await page.evaluate(() => {
        document.getElementById('pickup').checked = true;
    });

    await page.waitForTimeout(1000);

    // Wrap handleFormSubmit with detailed tracing
    await page.evaluate(() => {
        window.handleFormSubmitTrace = [];

        const originalHandleFormSubmit = window.handleFormSubmit;
        window.handleFormSubmit = function(e) {
            window.handleFormSubmitTrace.push('handleFormSubmit called');

            try {
                e.preventDefault();
                window.handleFormSubmitTrace.push('preventDefault called');

                if (window.cartItems.length === 0) {
                    window.handleFormSubmitTrace.push('ERROR: cart empty');
                    window.showError('Your cart is empty. Please add items before checkout.');
                    return;
                }
                window.handleFormSubmitTrace.push('cart not empty: ' + window.cartItems.length);

                const form = document.getElementById('checkoutForm');
                const formData = new FormData(form);
                const orderData = {
                    fullName: formData.get('fullName').trim(),
                    phoneNumber: formData.get('phoneNumber').trim(),
                    deliveryCoordinates: formData.get('deliveryCoordinates').trim(),
                    orderType: formData.get('orderType'),
                    additionalNotes: formData.get('additionalNotes').trim()
                };
                window.handleFormSubmitTrace.push('orderData: ' + JSON.stringify(orderData));

                if (!window.validateForm(orderData)) {
                    window.handleFormSubmitTrace.push('ERROR: validateForm failed');
                    return;
                }
                window.handleFormSubmitTrace.push('validateForm passed');

                window.processOrder(orderData);
                window.handleFormSubmitTrace.push('processOrder called');
            } catch (error) {
                window.handleFormSubmitTrace.push('ERROR: ' + error.message);
                console.error('handleFormSubmit error:', error);
            }
        };
    });

    // Manually call handleFormSubmit
    const result = await page.evaluate(() => {
        const form = document.getElementById('checkoutForm');
        const mockEvent = {
            preventDefault: () => {},
            target: form
        };

        try {
            window.handleFormSubmit(mockEvent);
            return { success: true, trace: window.handleFormSubmitTrace };
        } catch (error) {
            return { success: false, error: error.message, trace: window.handleFormSubmitTrace };
        }
    });

    console.log('Execution trace:', result.trace);

    await page.waitForTimeout(5000);

    console.log('WhatsApp URL:', whatsappUrl);
});
