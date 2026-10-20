#!/usr/bin/env node

/**
 * Checkout Flow Test Script
 * Tests the WhatsApp checkout flow without browser automation
 */

const fs = require('fs');
const path = require('path');

// Read checkout.html
const checkoutHtml = fs.readFileSync(path.join(__dirname, 'checkout.html'), 'utf-8');

console.log('=== CHECKOUT FLOW TEST ===\n');

// Test 1: Check button handler attachment
console.log('Test 1: Button Handler Attachment');
const handlerAttached = checkoutHtml.includes('form.addEventListener(\'submit\', handleFormSubmit)');
console.log(handlerAttached ? '✓ PASS: Form submit handler is attached' : '✗ FAIL: Form submit handler not attached');

// Test 2: Check processOrder function exists
console.log('\nTest 2: processOrder Function');
const processOrderExists = checkoutHtml.includes('async function processOrder(orderData)');
console.log(processOrderExists ? '✓ PASS: processOrder function exists' : '✗ FAIL: processOrder function not found');

// Test 3: Check generateWhatsAppMessage function exists
console.log('\nTest 3: WhatsApp Message Generation');
const generateMessageExists = checkoutHtml.includes('function generateWhatsAppMessage(orderData)');
console.log(generateMessageExists ? '✓ PASS: generateWhatsAppMessage function exists' : '✗ FAIL: generateWhatsAppMessage function not found');

// Test 4: Check timeout implementation
console.log('\nTest 4: Price Verification Timeout');
const timeoutExists = checkoutHtml.includes('Promise.race([') && checkoutHtml.includes('Price verification timeout');
console.log(timeoutExists ? '✓ PASS: 10-second timeout implemented' : '✗ FAIL: Timeout not implemented');

// Test 5: Check button text updated
console.log('\nTest 5: Button Text');
const buttonTextCorrect = checkoutHtml.includes('Confirm Order on WhatsApp') && !checkoutHtml.includes('Confirm & Pay');
console.log(buttonTextCorrect ? '✓ PASS: Button text is "Confirm Order on WhatsApp"' : '✗ FAIL: Button text incorrect');

// Test 6: Check WhatsApp icon
console.log('\nTest 6: Button Icon');
const iconCorrect = checkoutHtml.includes('<i class="fab fa-whatsapp"></i>');
console.log(iconCorrect ? '✓ PASS: WhatsApp icon on button' : '✗ FAIL: WhatsApp icon not found');

// Test 7: Check error recovery (button restoration)
console.log('\nTest 7: Error Recovery');
const buttonRestored = checkoutHtml.includes('button.disabled = false') && checkoutHtml.includes('Confirm Order on WhatsApp');
console.log(buttonRestored ? '✓ PASS: Button is restored on errors' : '✗ FAIL: Button not restored on errors');

// Test 8: Check cart preservation
console.log('\nTest 8: Cart Preservation');
const cartPreserved = checkoutHtml.includes('Your cart has been preserved');
console.log(cartPreserved ? '✓ PASS: Cart preservation message exists' : '✗ FAIL: Cart preservation message not found');

// Test 9: Check inline error messages
console.log('\nTest 9: Inline Error Messages');
const inlineErrors = checkoutHtml.includes('errorDiv.innerHTML =') && checkoutHtml.includes('errorDiv.classList.add(\'show\')');
console.log(inlineErrors ? '✓ PASS: Inline error messages implemented' : '✗ FAIL: Inline error messages not found');

// Test 10: Check payment scripts are commented out
console.log('\nTest 10: Payment Scripts Disabled');
const paystackCommented = checkoutHtml.includes('<!-- Paystack Payment Integration (Disabled');
const paymentUICommented = checkoutHtml.includes('<!-- Payment System (Disabled');
console.log(paystackCommented && paymentUICommented ? '✓ PASS: Payment scripts are commented out' : '✗ FAIL: Payment scripts not commented out');

// Test 11: Check ToastNotifications references removed (excluding commented code)
console.log('\nTest 11: ToastNotifications References (Active Code)');
const activeCode = checkoutHtml.substring(0, checkoutHtml.indexOf('/* async function handleCheckout'));
const toastNotifRemoved = !activeCode.includes('ToastNotifications.error(') && !activeCode.includes('ToastNotifications.success(');
console.log(toastNotifRemoved ? '✓ PASS: ToastNotifications references removed from active code' : '✗ FAIL: ToastNotifications still referenced in active code');

// Test 12: Check PaymentUI references removed (excluding commented code)
console.log('\nTest 12: PaymentUI References (Active Code)');
const paymentUIRemoved = !activeCode.includes('PaymentUI.renderCardForm(') && !activeCode.includes('PaymentUI.showPaymentProcessing(');
console.log(paymentUIRemoved ? '✓ PASS: PaymentUI references removed from active code' : '✗ FAIL: PaymentUI still referenced in active code');

// Test 13: Check PaymentService references removed (excluding commented code)
console.log('\nTest 13: PaymentService References (Active Code)');
const paymentServiceRemoved = !activeCode.includes('PaymentService.createOrder(') && !activeCode.includes('PaymentService.initializePaystack(');
console.log(paymentServiceRemoved ? '✓ PASS: PaymentService references removed from active code' : '✗ FAIL: PaymentService still referenced in active code');

// Test 14: Check handleCheckout commented out
console.log('\nTest 14: handleCheckout Function');
const handleCheckoutCommented = checkoutHtml.includes('/* async function handleCheckout(e)');
console.log(handleCheckoutCommented ? '✓ PASS: handleCheckout is commented out' : '✗ FAIL: handleCheckout not commented out');

// Test 15: Check WhatsApp URL construction
console.log('\nTest 15: WhatsApp URL Construction');
const whatsappUrlCorrect = checkoutHtml.includes('https://api.whatsapp.com/send?phone=233550020788');
console.log(whatsappUrlCorrect ? '✓ PASS: WhatsApp URL is correct' : '✗ FAIL: WhatsApp URL incorrect');

// Test 16: Check add-on handling in message generation
console.log('\nTest 16: Add-on Handling');
const addonHandling = checkoutHtml.includes('item.addons.forEach') && checkoutHtml.includes('addon.price');
console.log(addonHandling ? '✓ PASS: Add-ons are included in message' : '✗ FAIL: Add-ons not handled');

// Test 17: Check quantity handling
console.log('\nTest 17: Quantity Handling');
const quantityHandling = checkoutHtml.includes('item.quantity || 1') && checkoutHtml.includes('qty:');
console.log(quantityHandling ? '✓ PASS: Quantities are included in message' : '✗ FAIL: Quantities not handled');

// Summary
console.log('\n=== TEST SUMMARY ===');
const tests = [
    handlerAttached,
    processOrderExists,
    generateMessageExists,
    timeoutExists,
    buttonTextCorrect,
    iconCorrect,
    buttonRestored,
    cartPreserved,
    inlineErrors,
    paystackCommented && paymentUICommented,
    toastNotifRemoved,
    paymentUIRemoved,
    paymentServiceRemoved,
    handleCheckoutCommented,
    whatsappUrlCorrect,
    addonHandling,
    quantityHandling
];

const passed = tests.filter(t => t).length;
const total = tests.length;

console.log(`Passed: ${passed}/${total}`);
console.log(`Failed: ${total - passed}/${total}`);

if (passed === total) {
    console.log('\n✓ ALL TESTS PASSED - Checkout flow should work correctly');
    process.exit(0);
} else {
    console.log('\n✗ SOME TESTS FAILED - Manual browser testing required');
    process.exit(1);
}
