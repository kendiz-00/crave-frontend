const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('\n=== Test CRAVE15 and CORPERATE Promo Codes ===');

  try {
    // Navigate to checkout
    console.log('1. Navigating to checkout...');
    await page.goto('https://www.craveghana.com/checkout', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Set up cart
    console.log('2. Setting up test cart (GH¢ 100)...');
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
    await page.fill('#fullName', 'CRAVE15 Test');
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

    // Test CRAVE15
    console.log('5. Testing CRAVE15 (15% off)...');
    const promoInput = page.locator('#promoCode');
    await promoInput.fill('CRAVE15');

    const applyBtn = page.locator('#applyPromoBtn');
    await applyBtn.click();
    await page.waitForTimeout(5000);

    const promoMessage = page.locator('#promoCodeMessage');
    const messageText = await promoMessage.textContent();
    console.log('   Message:', messageText);

    const discountRow = page.locator('#promoDiscountRow');
    const discountRowVisible = await discountRow.isVisible();
    console.log('   Discount row visible:', discountRowVisible);

    let discountAmount = '0';
    if (discountRowVisible) {
      const promoVal = page.locator('#promoDiscountSummaryValue');
      discountAmount = await promoVal.textContent();
      console.log('   Discount amount:', discountAmount);
    }

    const totalEl = page.locator('#totalAmount');
    const totalText = await totalEl.textContent();
    console.log('   Final total:', totalText);

    console.log('\n=== CRAVE15 RESULTS ===');
    if (messageText && messageText.includes('CRAVE15') && messageText.includes('applied')) {
      console.log('✅ CRAVE15 applied successfully');
    } else {
      console.log('❌ CRAVE15 not applied');
    }

    if (discountRowVisible && discountAmount.includes('15')) {
      console.log('✅ 15% discount displayed');
    } else {
      console.log('❌ Discount not 15%');
    }

    if (totalText === 'GH¢ 85.00') {
      console.log('✅ Total correct (100 - 15 = 85)');
    } else {
      console.log('❌ Total incorrect, expected GH¢ 85.00, got:', totalText);
    }

    // Test CORPERATE
    console.log('\n6. Testing CORPERATE (10% off)...');
    await promoInput.fill('CORPERATE');
    await applyBtn.click();
    await page.waitForTimeout(5000);

    const messageText2 = await promoMessage.textContent();
    console.log('   Message:', messageText2);

    const discountAmount2 = await page.locator('#promoDiscountSummaryValue').textContent();
    console.log('   Discount amount:', discountAmount2);

    const totalText2 = await totalEl.textContent();
    console.log('   Final total:', totalText2);

    console.log('\n=== CORPERATE RESULTS ===');
    if (messageText2 && messageText2.includes('CORPERATE') && messageText2.includes('applied')) {
      console.log('✅ CORPERATE applied successfully');
    } else {
      console.log('❌ CORPERATE not applied');
    }

    if (discountAmount2.includes('10')) {
      console.log('✅ 10% discount displayed');
    } else {
      console.log('❌ Discount not 10%');
    }

    if (totalText2 === 'GH¢ 90.00') {
      console.log('✅ Total correct (100 - 10 = 90)');
    } else {
      console.log('❌ Total incorrect, expected GH¢ 90.00, got:', totalText2);
    }

    // Test without code
    console.log('\n7. Testing without promo code...');
    await promoInput.fill('');
    await applyBtn.click();
    await page.waitForTimeout(3000);

    const totalText3 = await totalEl.textContent();
    console.log('   Final total:', totalText3);

    console.log('\n=== NO CODE RESULTS ===');
    if (totalText3 === 'GH¢ 100.00') {
      console.log('✅ Total correct without discount (100)');
    } else {
      console.log('❌ Total incorrect, expected GH¢ 100.00, got:', totalText3);
    }

  } catch (error) {
    console.error('Test error:', error);
  }

  await browser.close();
  console.log('\n=== Test Complete ===');
})();
