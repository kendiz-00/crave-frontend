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

test('debug processOrder with detailed logging', async ({ page, context }) => {
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

    // Intercept WhatsApp
    let whatsappUrl = null;
    context.route('https://api.whatsapp.com/**', (route) => {
        whatsappUrl = route.request().url();
        console.log('WhatsApp intercepted:', whatsappUrl);
        route.abort();
    });

    // Mock MenuAPI to return success
    await page.route('**/api/menu', (route) => {
        console.log('Menu API request intercepted');
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

    // Intercept all console messages
    const consoleMessages = [];
    page.on('console', msg => {
        consoleMessages.push({ type: msg.type(), text: msg.text() });
        console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // Wait for initialization
    await page.waitForTimeout(1000);

    // Wrap processOrder with detailed logging
    const result = await page.evaluate(() => {
        const originalProcessOrder = window.processOrder;

        window.processOrder = async function(orderData) {
            console.log('[DEBUG] processOrder called with:', orderData);
            console.log('[DEBUG] cartItems:', window.cartItems);

            try {
                const result = await originalProcessOrder.call(this, orderData);
                console.log('[DEBUG] processOrder completed');
                return result;
            } catch (error) {
                console.log('[DEBUG] processOrder error:', error.message);
                console.log('[DEBUG] error stack:', error.stack);
                throw error;
            }
        };

        const orderData = {
            fullName: 'Test Customer',
            phoneNumber: '0500000000',
            deliveryCoordinates: '5.6037,-0.1870',
            orderType: 'Pickup',
            additionalNotes: 'Test order'
        };

        console.log('Calling processOrder with:', orderData);

        try {
            window.processOrder(orderData);
            return { success: true, error: null };
        } catch (error) {
            console.log('Error calling processOrder:', error);
            return { success: false, error: error.message };
        }
    });

    console.log('processOrder result:', result);

    // Wait for async processing
    await page.waitForTimeout(8000);

    console.log('WhatsApp URL:', whatsappUrl);
    console.log('Console messages:', consoleMessages);

    expect(whatsappUrl).toBeTruthy();
});
