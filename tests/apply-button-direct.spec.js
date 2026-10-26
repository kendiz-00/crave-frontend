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

  console.log('\n=== Test CORPERATE Promo Code Apply Button (Direct) ===');

  try {
    // Set up cart first
    console.log('1. Setting up cart with test item...');
    await page.goto('https://www.craveghana.com/checkout', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

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
    console.log('   Cart set');

    // Reload to apply cart
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Fill form
    console.log('2. Filling checkout form...');
    const nameInput = page.locator('#customerName');
    const nameExists = await nameInput.count();
    if (nameExists > 0) {
      await nameInput.fill('CORPERATE Test');
      console.log('   Name filled');
    } else {
      console.log('   ❌ FAIL: Name input not found');
      await browser.close();
      return;
    }

    await page.fill('#customerPhone', '0500000000');
    
    // Select pickup
    const pickupRadio = page.locator('input[value="PICKUP"]');
    const pickupExists = await pickupRadio.count();
    if (pickupExists > 0) {
      await pickupRadio.check();
      console.log('   Pickup selected');
    }

    // Open promo section
    console.log('3. Opening promo section...');
    const togglePromoBtn = page.locator('#togglePromoBtn');
    const toggleExists = await togglePromoBtn.count();
    if (toggleExists > 0) {
      await togglePromoBtn.click();
      await page.waitForTimeout(1000);
      console.log('   Promo section opened');
    }

    // Enter promo code
    console.log('4. Entering CORPERATE code...');
    const promoInput = page.locator('#promoCode');
    const inputExists = await promoInput.count();
    if (inputExists > 0) {
      await promoInput.fill('CORPERATE');
      console.log('   Code entered');
    } else {
      console.log('   ❌ FAIL: Promo input not found');
      await browser.close();
      return;
    }

    // Click Apply button
    console.log('5. Clicking Apply button...');
    const applyBtn = page.locator('#applyPromoBtn');
    await applyBtn.click();
    await page.waitForTimeout(5000);

    // Check for success message
    console.log('6. Checking promo validation result...');
    const promoMessage = page.locator('#promoCodeMessage');
    const messageText = await promoMessage.textContent();
    console.log('   Promo message:', messageText);

    // Check if discount row is visible
    const promoRow = page.locator('#promoDiscountRow');
    const promoRowVisible = await promoRow.isVisible();
    console.log('   Discount row visible:', promoRowVisible);

    let discountAmount = '0';
    if (promoRowVisible) {
      const promoVal = page.locator('#promoDiscountSummaryValue');
      discountAmount = await promoVal.textContent();
      console.log('   Discount amount:', discountAmount);
    }

    // Check subtotal
    const subtotalEl = page.locator('#subtotalAmount');
    const subtotalText = await subtotalEl.textContent();
    console.log('   Subtotal:', subtotalText);

    // Check final total
    const totalEl = page.locator('#totalAmount');
    const totalText = await totalEl.textContent();
    console.log('   Final total:', totalText);

    // Verify discount
    let discountPass = false;
    if (messageText && messageText.includes('CORPERATE') && messageText.includes('applied')) {
      console.log('   ✅ CORPERATE code applied successfully');
      discountPass = true;
    } else {
      console.log('   ❌ CORPERATE code not applied');
      console.log('   Message:', messageText);
    }

    // Verify discount row
    let rowPass = false;
    if (promoRowVisible) {
      console.log('   ✅ Discount row visible');
      rowPass = true;
    } else {
      console.log('   ❌ Discount row not visible');
    }

    // Click order button to test WhatsApp
    console.log('7. Clicking order button...');
    const orderBtn = page.locator('#placeOrderBtn');
    await orderBtn.click();
    await page.waitForTimeout(3000);

    // Check for WhatsApp redirect
    const currentUrl = page.url();
    console.log('8. Current URL:', currentUrl);

    let whatsappPass = false;
    if (currentUrl.includes('whatsapp.com')) {
      console.log('   ✅ WhatsApp redirect successful');
      
      // Parse WhatsApp URL
      const url = new URL(currentUrl);
      const message = url.searchParams.get('text');
      console.log('   WhatsApp message length:', message ? message.length : 0);
      
      if (message && message.includes('Promo Discount')) {
        console.log('   ✅ WhatsApp message includes promo discount');
        whatsappPass = true;
      } else {
        console.log('   ❌ WhatsApp message missing promo discount');
      }
    } else {
      console.log('   ❌ WhatsApp redirect did not occur');
    }

    // Final result
    console.log('\n=== TEST RESULTS ===');
    if (discountPass && rowPass && whatsappPass) {
      console.log('✅ ALL TESTS PASSED');
      console.log('   - CORPERATE applied: YES');
      console.log('   - Discount visible: YES');
      console.log('   - WhatsApp total: YES');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('   - CORPERATE applied:', discountPass ? 'YES' : 'NO');
      console.log('   - Discount visible:', rowPass ? 'YES' : 'NO');
      console.log('   - WhatsApp total:', whatsappPass ? 'YES' : 'NO');
    }

  } catch (error) {
    console.error('Test error:', error);
  }

  await browser.close();
  console.log('\n=== Test Complete ===');
})();
