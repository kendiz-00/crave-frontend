// Test local promo code validation
const testLocalPromo = () => {
  const LOCAL_PROMO_CODES = {
    CORPERATE: {
      code: 'CORPERATE',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      active: true,
    },
  };

  const validateLocal = (code, orderTotal) => {
    const promoCode = LOCAL_PROMO_CODES[code.toUpperCase()];

    if (!promoCode) {
      return {
        valid: false,
        message: 'Invalid promo code',
      };
    }

    if (!promoCode.active) {
      return {
        valid: false,
        message: 'Promo code is not active',
      };
    }

    let discountAmount = 0;
    if (promoCode.discountType === 'PERCENTAGE') {
      discountAmount = orderTotal * (promoCode.discountValue / 100);
    } else {
      discountAmount = promoCode.discountValue;
    }

    return {
      valid: true,
      code: promoCode.code,
      name: promoCode.code,
      discount: discountAmount,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      expiresAt: null,
    };
  };

  // Test with GHS 100 order
  const result = validateLocal('CORPERATE', 100);
  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.valid) {
    console.log('✅ CORPERATE code is valid');
    console.log('✅ Discount:', result.discount, '(10% of 100)');
  } else {
    console.log('❌ CORPERATE code is invalid');
  }
};

testLocalPromo();
