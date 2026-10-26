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

test('debug checkout button click execution', async ({ page, context }) => {
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

    // Capture all console messages
    const consoleMessages = [];
    page.on('console', msg => {
        consoleMessages.push({ type: msg.type(), text: msg.text() });
        console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // Check form state
    const formState = await page.evaluate(() => {
        const form = document.getElementById('checkoutForm');
        const button = document.getElementById('placeOrderBtn');
        const formData = new FormData(form);
        return {
            formExists: !!form,
            buttonExists: !!button,
            buttonDisabled: button ? button.disabled : null,
            buttonText: button ? button.textContent : null,
            formData: {
                fullName: formData.get('fullName'),
                phoneNumber: formData.get('phoneNumber')
            },
            cartItems: JSON.parse(localStorage.getItem('craveCart') || '[]').length
        };
    });
    console.log('Form state:', formState);

    // Fill in details
    await page.fill('#fullName', 'Test Customer');
    await page.fill('#phoneNumber', '0500000000');

    // Check button state after filling
    const buttonStateAfter = await page.evaluate(() => {
        const button = document.getElementById('placeOrderBtn');
        return {
            disabled: button ? button.disabled : null,
            text: button ? button.textContent : null
        };
    });
    console.log('Button state after filling:', buttonStateAfter);

    // Intercept WhatsApp
    let whatsappUrl = null;
    context.route('https://api.whatsapp.com/**', (route) => {
        whatsappUrl = route.request().url();
        console.log('WhatsApp intercepted:', whatsappUrl);
        route.abort();
    });

    // Inject debugging into the page
    await page.evaluate(() => {
        window.checkoutDebug = {
            handlerCalled: false,
            processOrderCalled: false,
            generateMessageCalled: false
        };

        // Wrap handleFormSubmit
        const originalHandleFormSubmit = window.handleFormSubmit;
        if (originalHandleFormSubmit) {
            window.handleFormSubmit = function(e) {
                window.checkoutDebug.handlerCalled = true;
                console.log('[DEBUG] handleFormSubmit called');
                return originalHandleFormSubmit.apply(this, arguments);
            };
        } else {
            console.log('[DEBUG] handleFormSubmit not found on window');
        }

        // Wrap processOrder
        const originalProcessOrder = window.processOrder;
        if (originalProcessOrder) {
            window.processOrder = function(orderData) {
                window.checkoutDebug.processOrderCalled = true;
                console.log('[DEBUG] processOrder called with:', orderData);
                return originalProcessOrder.apply(this, arguments);
            };
        } else {
            console.log('[DEBUG] processOrder not found on window');
        }

        // Wrap generateWhatsAppMessage
        const originalGenerateMessage = window.generateWhatsAppMessage;
        if (originalGenerateMessage) {
            window.generateWhatsAppMessage = function(orderData) {
                window.checkoutDebug.generateMessageCalled = true;
                console.log('[DEBUG] generateWhatsAppMessage called');
                return originalGenerateMessage.apply(this, arguments);
            };
        } else {
            console.log('[DEBUG] generateWhatsAppMessage not found on window');
        }

        console.log('[DEBUG] Debug wrappers installed');
    });

    // Click button
    console.log('Clicking button...');
    const button = page.locator('#placeOrderBtn');
    await button.click();

    // Wait
    await page.waitForTimeout(5000);

    // Check debug state
    const debugState = await page.evaluate(() => window.checkoutDebug);
    console.log('Debug state:', debugState);

    // Check if functions are defined on window
    const functionCheck = await page.evaluate(() => ({
        handleFormSubmit: typeof window.handleFormSubmit,
        processOrder: typeof window.processOrder,
        generateWhatsAppMessage: typeof window.generateWhatsAppMessage
    }));
    console.log('Function definitions:', functionCheck);

    console.log('Console messages:', consoleMessages);
    console.log('WhatsApp URL:', whatsappUrl);

    expect(whatsappUrl).toBeTruthy();
});
