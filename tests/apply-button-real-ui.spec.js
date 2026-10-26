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

  // Capture network requests
  page.on('request', request => {
    if (request.url().includes('simple-promo')) {
      console.log(`[Network] ${request.method()} ${request.url()}`);
      console.log(`[Network] Body: ${request.postData()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('simple-promo')) {
      console.log(`[Network] Status: ${response.status()}`);
      response.text().then(body => console.log(`[Network] Response: ${body}`));
    }
  });

  console.log('\n=== Test CORPERATE Apply Button (Real UI Path) ===');

  try {
    // Navigate to menu
    console.log('1. Navigating to menu...');
    await page.goto('https://www.craveghana.com/menu', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Try to add an item via menu
    console.log('2. Looking for menu items...');
    const menuItems = page.locator('.menu-item');
    const itemCount = await menuItems.count();
    console.log('   Menu items found:', itemCount);

    if (itemCount > 0) {
      // Click add to cart on first item
      console.log('   Adding first item to cart...');
      await menuItems.first().locator('.add-to-cart-btn').click();
      await page.waitForTimeout(2000);
    } else {
      console.log('   No menu items, using localStorage fallback');
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
    }

    // Navigate to checkout
    console.log('3. Navigating to checkout...');
    await page.goto('https://www.craveghana.com/checkout', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Check if cart is empty
    const emptyState = page.locator('#emptyCartState');
    const emptyVisible = await emptyState.isVisible();
    console.log('   Empty cart visible:', emptyVisible);

    if (emptyVisible) {
      console.log('   ❌ FAIL: Cart is empty');
      await browser.close();
      return;
    }

    // Fill form with correct IDs
    console.log('4. Filling checkout form...');
    const fullNameInput = page.locator('#fullName');
    const fullNameExists = await fullNameInput.count();
    console.log('   fullName input exists:', fullNameExists);

    if (fullNameExists > 0) {
      await fullNameInput.fill('CORPERATE Test');
      console.log('   Full name filled');
    } else {
      console.log('   ❌ FAIL: fullName input not found');
      await browser.close();
      return;
    }

    const phoneInput = page.locator('#phoneNumber');
    await phoneInput.fill('0500000000');
    console.log('   Phone filled');

    // Select pickup
    const pickupRadio = page.locator('input[value="PICKUP"]');
    const pickupExists = await pickupRadio.count();
    if (pickupExists > 0) {
      await pickupRadio.check();
      console.log('   Pickup selected');
    }

    // Open promo section
    console.log('5. Opening promo section...');
    const togglePromoBtn = page.locator('#togglePromoBtn');
    const toggleExists = await togglePromoBtn.count();
    console.log('   Toggle button exists:', toggleExists);

    if (toggleExists > 0) {
      await togglePromoBtn.click();
      await page.waitForTimeout(1000);
      console.log('   Promo section opened');
    }

    // Check if promo body is visible
    const promoBody = page.locator('#promoBody');
    const promoBodyVisible = await promoBody.isVisible();
    console.log('   Promo body visible:', promoBodyVisible);

    if (!promoBodyVisible) {
      console.log('   ❌ FAIL: Promo body not visible after toggle');
      await browser.close();
      return;
    }

    // Enter promo code
    console.log('6. Entering CORPERATE code...');
    const promoInput = page.locator('#promoCode');
    const inputExists = await promoInput.count();
    console.log('   Promo input exists:', inputExists);

    if (inputExists > 0) {
      await promoInput.fill('CORPERATE');
      console.log('   Code entered');
    } else {
      console.log('   ❌ FAIL: Promo input not found');
      await browser.close();
      return;
    }

    // Check button type
    const applyBtn = page.locator('#applyPromoBtn');
    const buttonType = await applyBtn.getAttribute('type');
    console.log('   Apply button type:', buttonType);

    // Click Apply button
    console.log('7. Clicking Apply button...');
    await applyBtn.click();
    await page.waitForTimeout(5000);

    // Check for success message
    console.log('8. Checking promo validation result...');
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
    console.log('9. Clicking order button...');
    const orderBtn = page.locator('#placeOrderBtn');
    await orderBtn.click();
    await page.waitForTimeout(3000);

    // Check for WhatsApp redirect
    const currentUrl = page.url();
    console.log('10. Current URL:', currentUrl);

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
