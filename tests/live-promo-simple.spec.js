const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Override console.log to capture logs
  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });

  console.log('\n=== Test CORPERATE Promo Code on Live Checkout (Simplified) ===');

  try {
    // Navigate to checkout
    console.log('Navigating to checkout...');
    await page.goto('https://www.craveghana.com/checkout', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Check if page loaded
    const title = await page.title();
    console.log('Page title:', title);

    // Check if promo code input exists
    const promoInput = page.locator('#promoCode');
    const inputExists = await promoInput.isVisible();
    console.log('Promo input visible:', inputExists);

    if (!inputExists) {
      console.log('❌ FAIL: Promo input not found on page');
      await browser.close();
      return;
    }

    // Open promo section
    console.log('Opening promo section...');
    const togglePromoBtn = page.locator('#togglePromoBtn');
    if (await togglePromoBtn.isVisible()) {
      await togglePromoBtn.click();
      await page.waitForTimeout(1000);
    }

    // Enter promo code
    console.log('Entering CORPERATE code...');
    await promoInput.fill('CORPERATE');

    // Click Apply button
    console.log('Clicking Apply button...');
    const applyBtn = page.locator('#applyPromoBtn');
    await applyBtn.click();
    await page.waitForTimeout(5000);

    // Check for success message
    const promoMessage = page.locator('#promoCodeMessage');
    const messageText = await promoMessage.textContent();
    console.log('Promo message:', messageText);

    // Check if discount row is visible
    const promoRow = page.locator('#promoDiscountRow');
    const promoRowVisible = await promoRow.isVisible();
    console.log('Promo discount row visible:', promoRowVisible);

    if (promoRowVisible) {
      const promoVal = page.locator('#promoDiscountSummaryValue');
      const discountText = await promoVal.textContent();
      console.log('Discount amount:', discountText);
    }

    // Verify
    let passed = true;
    if (messageText && messageText.includes('CORPERATE') && messageText.includes('applied')) {
      console.log('✅ PASS: CORPERATE code applied successfully');
    } else {
      console.log('❌ FAIL: CORPERATE code not applied');
      console.log('   Message:', messageText);
      passed = false;
    }

    if (promoRowVisible) {
      console.log('✅ PASS: Discount row visible');
    } else {
      console.log('❌ FAIL: Discount row not visible');
      passed = false;
    }

    if (passed) {
      console.log('\n✅ ALL TESTS PASSED');
    } else {
      console.log('\n❌ SOME TESTS FAILED');
    }

  } catch (error) {
    console.error('Test error:', error);
  }

  await browser.close();
  console.log('\n=== Test Complete ===');
})();
