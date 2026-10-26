// Test CORPERATE promo code validation
const testPromoCode = async () => {
  const response = await fetch('https://crave-backend.vercel.app/api/simple-promo/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: 'CORPERATE',
    }),
  });

  const data = await response.json();
  console.log('Response status:', response.status);
  console.log('Response data:', JSON.stringify(data, null, 2));

  if (data.valid) {
    console.log('✅ CORPERATE code is valid');
    console.log('✅ Discount:', data.discountValue, data.discountType);
  } else {
    console.log('❌ CORPERATE code is invalid');
  }
};

testPromoCode();
