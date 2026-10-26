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

  console.log('\n=== Test CORPERATE Apply Button (Direct Trigger) ===');

  try {
    // Navigate to checkout
    console.log('1. Navigating to checkout...');
    await page.goto('https://www.craveghana.com/checkout', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Set up cart and reload
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

    // Reload to trigger cart loading
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Directly trigger the promo code handler in browser context
    console.log('3. Simulating Apply button click in browser context...');
    const result = await page.evaluate(async () => {
      // Set up cart for handler
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

      // Simulate the Apply button handler logic
      const code = 'CORPERATE';
      const cart = JSON.parse(localStorage.getItem('craveCart')) || [];
      
      console.log('[Test] Code:', code);
      console.log('[Test] Cart items:', cart.length);

      // Calculate order total
      let orderTotal = 0;
      cart.forEach(item => {
        const itemTotal = (item.unitPrice || item.price || 0) * (item.quantity || 1);
        orderTotal += itemTotal;
        if (item.addOns && item.addOns.length > 0) {
          item.addOns.forEach(addOn => {
            orderTotal += addOn.price * (item.quantity || 1);
          });
        }
      });

      console.log('[Test] Order total:', orderTotal);

      // Call promo validation
      if (typeof CravePromoCodes !== 'undefined') {
        const result = await CravePromoCodes.apply(code, orderTotal, cart);
        console.log('[Test] Validation result:', result);
        return result;
      } else {
        return { error: 'CravePromoCodes not defined' };
      }
    });

    console.log('4. Validation result:', JSON.stringify(result, null, 2));

    if (result.valid && result.discount === 10) {
      console.log('✅ PASS: CORPERATE validates with 10% discount from cart total');
    } else {
      console.log('❌ FAIL: CORPERATE validation failed');
    }

  } catch (error) {
    console.error('Test error:', error);
  }

  await browser.close();
  console.log('\n=== Test Complete ===');
})();
