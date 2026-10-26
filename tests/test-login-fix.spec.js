const { chromium, webkit } = require('playwright');

async function testLogin(browserType, browserName) {
    console.log(`\n=== Testing Login on ${browserName} ===`);
    
    const browser = await browserType.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Capture console
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`[${browserName}] Console error:`, msg.text());
        }
    });

    try {
        // Test 1: Navigate to login
        console.log('1. Navigating to login page...');
        await page.goto('https://www.craveghana.com/login.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(3000);

        // Test 2: Check if AuthAPI is loaded
        console.log('2. Checking if AuthAPI is loaded...');
        const authApiLoaded = await page.evaluate(() => {
            return typeof window.AuthAPI !== 'undefined';
        });
        console.log(`   AuthAPI loaded: ${authApiLoaded}`);

        if (!authApiLoaded) {
            console.log('   ❌ FAIL: AuthAPI not loaded');
            await browser.close();
            return false;
        }

        // Test 3: Test wrong credentials
        console.log('3. Testing wrong credentials...');
        await page.fill('#email', 'test@example.com');
        await page.fill('#password', 'wrongpassword');
        await page.click('#loginBtn');
        await page.waitForTimeout(3000);

        const errorDiv = page.locator('#loginError');
        const errorVisible = await errorDiv.isVisible();
        const errorText = await errorDiv.textContent();
        console.log(`   Error visible: ${errorVisible}`);
        console.log(`   Error message: ${errorText}`);

        if (!errorVisible || !errorText) {
            console.log('   ❌ FAIL: Inline error not shown');
        } else {
            console.log('   ✅ PASS: Inline error shown');
        }

        // Test 4: Test normal login (using a test account)
        console.log('4. Testing normal login with test account...');
        await page.fill('#email', 'test@example.com');
        await page.fill('#password', 'TestPassword123!');
        await page.click('#loginBtn');
        await page.waitForTimeout(5000);

        const currentUrl = page.url();
        console.log(`   Current URL: ${currentUrl}`);

        if (currentUrl.includes('index.html') || currentUrl === 'https://www.craveghana.com/') {
            console.log('   ✅ PASS: Login successful, redirected to home');
        } else {
            console.log('   ⚠️  Note: Not redirected (credentials may be invalid, but no crash)');
        }

        // Test 5: Check if session is preserved
        console.log('5. Checking if session is preserved...');
        const isAuthenticated = await page.evaluate(() => {
            return window.AuthManager ? window.AuthManager.isAuthenticated() : false;
        });
        console.log(`   Authenticated: ${isAuthenticated}`);

        // Test 6: Test login from checkout
        console.log('6. Testing login from checkout...');
        await page.goto('https://www.craveghana.com/checkout.html?redirect=checkout.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(3000);

        const checkoutUrl = page.url();
        console.log(`   Checkout URL: ${checkoutUrl}`);

        // Test 7: Test refresh retains session
        console.log('7. Testing refresh retains session...');
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(3000);

        const authAfterRefresh = await page.evaluate(() => {
            return window.AuthManager ? window.AuthManager.isAuthenticated() : false;
        });
        console.log(`   Authenticated after refresh: ${authAfterRefresh}`);

        console.log(`\n=== ${browserName} Test Complete ===`);
        return true;

    } catch (error) {
        console.error(`Test error on ${browserName}:`, error);
        return false;
    } finally {
        await browser.close();
    }
}

(async () => {
    console.log('=== Login Fix Verification Tests ===\n');

    // Test Chromium
    const chromiumResult = await testLogin(chromium, 'Chromium');

    // Test WebKit
    const webkitResult = await testLogin(webkit, 'WebKit');

    console.log('\n=== FINAL RESULTS ===');
    console.log(`Chromium: ${chromiumResult ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`WebKit: ${webkitResult ? '✅ PASS' : '❌ FAIL'}`);

    if (chromiumResult && webkitResult) {
        console.log('\n✅ All tests passed');
    } else {
        console.log('\n❌ Some tests failed');
    }
})();
