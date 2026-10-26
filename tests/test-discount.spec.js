const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Override console.log to capture logs
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error') {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    }
  });

  // Capture network requests
  page.on('request', request => {
    if (request.url().includes('simple-promo')) {
      console.log(`[Network] ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('simple-promo')) {
      console.log(`[Network] Status: ${response.status()}`);
    }
  });

  console.log('\n=== Test CORPERATE Discount Display ===');

  try {
    // Navigate to checkout
    console.log('1. Navigating to checkout...');
    await page.goto('https://www.craveghana.com/checkout', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Set up cart
    console.log('2. Setting up test cart...');
    await page.evaluate(() => {
      const testCart = [
        {
          menuItemId: 'test-item-123',
          name: 'Test Item',
          price: 100,
          unitPrice: 100,
          quantity: 1,
          addOns: [],
        }
      ];
      localStorage.setItem('craveCart', JSON.stringify(testCart));
    });

    // Reload
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Fill form
    console.log('3. Filling form...');
    await page.fill('#fullName', 'CORPERATE Test');
    await page.fill('#phoneNumber', '0500000000');
    const pickupRadio = page.locator('input[value="PICKUP"]');
    if (await pickupRadio.count() > 0) {
      await pickupRadio.check();
    }

    // Open promo section
    console.log('4. Opening promo section...');
    const togglePromoBtn = page.locator('#togglePromoBtn');
    await togglePromoBtn.click();
    await page.waitForTimeout(1000);

    // Check if promo body is visible
    const promoBody = page.locator('#promoBody');
    const promoBodyVisible = await promoBody.isVisible();
    console.log('   Promo body visible:', promoBodyVisible);

    if (!promoBodyVisible) {
      console.log('   ❌ FAIL: Promo body not visible');
      await browser.close();
      return;
    }

    // Enter code
    console.log('5. Entering CORPERATE...');
    const promoInput = page.locator('#promoCode');
    await promoInput.fill('CORPERATE');

    // Click Apply
    console.log('6. Clicking Apply...');
    const applyBtn = page.locator('#applyPromoBtn');
    await applyBtn.click();
    await page.waitForTimeout(5000);

    // Check discount
    console.log('7. Checking discount display...');
    const promoMessage = page.locator('#promoCodeMessage');
    const messageText = await promoMessage.textContent();
    console.log('   Message:', messageText);

    const promoRow = page.locator('#promoDiscountRow');
    const promoRowVisible = await promoRow.isVisible();
    console.log('   Discount row visible:', promoRowVisible);

    let discountAmount = '0';
    if (promoRowVisible) {
      const promoVal = page.locator('#promoDiscountSummaryValue');
      discountAmount = await promoVal.textContent();
      console.log('   Discount amount:', discountAmount);
    }

    const subtotalEl = page.locator('#subtotalAmount');
    const subtotalText = await subtotalEl.textContent();
    console.log('   Subtotal:', subtotalText);

    const totalEl = page.locator('#totalAmount');
    const totalText = await totalEl.textContent();
    console.log('   Final total:', totalText);

    // Verify
    console.log('\n=== RESULTS ===');
    if (messageText && messageText.includes('CORPERATE') && messageText.includes('applied')) {
      console.log('✅ CORPERATE applied successfully');
    } else {
      console.log('❌ CORPERATE not applied');
    }

    if (promoRowVisible && discountAmount.includes('10')) {
      console.log('✅ 10% discount displayed');
    } else {
      console.log('❌ Discount not displayed correctly');
    }

    if (subtotalText === 'GH¢ 100.00' && totalText === 'GH¢ 90.00') {
      console.log('✅ Totals correct (100 - 10 = 90)');
    } else {
      console.log('❌ Totals incorrect');
    }

    // Test WhatsApp
    console.log('8. Testing WhatsApp order...');
    const checkoutForm = page.locator('#checkoutForm');
    await checkoutForm.submit();
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);

    if (currentUrl.includes('wa.me') || currentUrl.includes('whatsapp.com')) {
      console.log('✅ WhatsApp redirect occurred');
    } else {
      console.log('❌ WhatsApp redirect did not occur');
    }

  } catch (error) {
    console.error('Test error:', error);
  }

  await browser.close();
  console.log('\n=== Test Complete ===');
})();
