const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Override console.log to capture logs
  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });

  console.log('\n=== Test CORPERATE Promo Code on Live Checkout ===');

  try {
    // Navigate to checkout
    console.log('Navigating to checkout...');
    await page.goto('https://www.craveghana.com/checkout');
    await page.waitForLoadState('networkidle');

    // Manually add a test item to cart via localStorage
    console.log('Adding test item to cart...');
    await page.evaluate(() => {
      const testCart = [
        {
          menuItemId: 'test-id-123',
          name: 'Test Item',
          price: 100,
          unitPrice: 100,
          quantity: 1,
          addOns: [],
        }
      ];
      localStorage.setItem('craveCart', JSON.stringify(testCart));
    });

    // Reload to apply cart
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Fill form
    console.log('Filling checkout form...');
    await page.fill('#customerName', 'CORPERATE Test');
    await page.fill('#customerPhone', '0500000000');
    await page.check('input[value="PICKUP"]');

    // Open promo section
    console.log('Opening promo section...');
    const togglePromoBtn = page.locator('#togglePromoBtn');
    if (await togglePromoBtn.isVisible()) {
      await togglePromoBtn.click();
      await page.waitForTimeout(500);
    }

    // Enter promo code
    console.log('Entering CORPERATE code...');
    const promoInput = page.locator('#promoCode');
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

    // Check subtotal
    const subtotalEl = page.locator('#subtotalAmount');
    const subtotalText = await subtotalEl.textContent();
    console.log('Subtotal:', subtotalText);

    // Check final total
    const totalEl = page.locator('#totalAmount');
    const totalText = await totalEl.textContent();
    console.log('Final total:', totalText);

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
