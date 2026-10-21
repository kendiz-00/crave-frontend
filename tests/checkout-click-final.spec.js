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

test('normal button click', async ({ page, context }) => {
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

    // Select Pickup
    await page.evaluate(() => {
        document.getElementById('pickup').checked = true;
    });

    // Wait for initialization
    await page.waitForTimeout(1000);

    // Click button normally
    const button = page.locator('#placeOrderBtn');
    await button.click();

    // Wait for processing
    await page.waitForTimeout(5000);

    console.log('WhatsApp URL:', whatsappUrl);

    expect(whatsappUrl).toBeTruthy();
    // URL is encoded, so check for encoded version
    expect(whatsappUrl).toContain('Loaded%20Fries');
    expect(whatsappUrl).toContain('Extra%20Cheese');
});
