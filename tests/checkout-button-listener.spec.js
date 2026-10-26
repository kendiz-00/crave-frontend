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

test('check button click listener attachment', async ({ page }) => {
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
    await page.waitForTimeout(1000);

    // Check button listener
    const buttonCheck = await page.evaluate(() => {
        const button = document.getElementById('placeOrderBtn');
        return {
            buttonExists: !!button,
            clickBound: button ? button.dataset.clickBound : null,
            buttonType: button ? button.type : null
        };
    });

    console.log('Button check:', buttonCheck);

    // Manually attach click listener
    await page.evaluate(() => {
        const button = document.getElementById('placeOrderBtn');
        button.addEventListener('click', function(e) {
            console.log('[BUTTON CLICK] Click handler fired');
            e.preventDefault();
            window.handleFormSubmit(e);
        });
        console.log('Click listener attached');
    });

    // Test click
    await page.evaluate(() => {
        const button = document.getElementById('placeOrderBtn');
        button.click();
        console.log('Button clicked programmatically');
    });

    await page.waitForTimeout(1000);
});
