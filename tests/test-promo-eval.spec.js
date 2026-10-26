const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Override console.log to capture logs
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error') {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    }
  });

  console.log('\n=== Test CORPERATE Promo Code Direct Browser Evaluation ===');

  try {
    // Navigate to checkout
    console.log('1. Navigating to checkout...');
    await page.goto('https://www.craveghana.com/checkout', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Directly test promo code validation in browser context
    console.log('2. Testing promo code validation in browser context...');
    const result = await page.evaluate(async () => {
      if (typeof CravePromoCodes !== 'undefined') {
        console.log('[Browser] CravePromoCodes is defined');
        const result = await CravePromoCodes.apply('CORPERATE', 100, []);
        console.log('[Browser] Validation result:', result);
        return result;
      } else {
        console.log('[Browser] CravePromoCodes is NOT defined');
        return { error: 'CravePromoCodes not defined' };
      }
    });

    console.log('3. Validation result:', JSON.stringify(result, null, 2));

    if (result.valid && result.discount === 10) {
      console.log('✅ PASS: CORPERATE validates with 10% discount');
    } else {
      console.log('❌ FAIL: CORPERATE validation failed');
    }

  } catch (error) {
    console.error('Test error:', error);
  }

  await browser.close();
  console.log('\n=== Test Complete ===');
})();
