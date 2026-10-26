const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('\n=== Test CORPERATE Promo Code ===');

  // Navigate to menu
  console.log('Navigating to menu...');
  await page.goto('https://www.craveghana.com/menu');
  await page.waitForLoadState('networkidle');

  // Add an item to cart
  console.log('Adding item to cart...');
  const menuItem = await page.locator('.menu-item').first();
  await menuItem.locator('.add-to-cart-btn').click();
  await page.waitForTimeout(2000);

  // Navigate to checkout
  console.log('Navigating to checkout...');
  await page.goto('https://www.craveghana.com/checkout');
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
  await page.waitForTimeout(3000);

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
  if (messageText && messageText.includes('CORPERATE') && messageText.includes('applied')) {
    console.log('✅ PASS: CORPERATE code applied successfully');
  } else {
    console.log('❌ FAIL: CORPERATE code not applied');
  }

  if (promoRowVisible) {
    console.log('✅ PASS: Discount row visible');
  } else {
    console.log('❌ FAIL: Discount row not visible');
  }

  await browser.close();
  console.log('\n=== Test Complete ===');
})();
