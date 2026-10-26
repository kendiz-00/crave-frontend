// Test CORPERATE promo code validation with actual backend (Render)
const testPromoCode = async () => {
  console.log('Testing CORPERATE promo code on Render backend...');

  try {
    const response = await fetch('https://crave-backend-oie3.onrender.com/api/simple-promo/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'CORPERATE',
      }),
    });

    console.log('Response status:', response.status);

    const text = await response.text();
    console.log('Response text:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.log('Response is not JSON:', text);
      return;
    }

    console.log('Parsed data:', JSON.stringify(data, null, 2));

    if (data.valid) {
      console.log('✅ CORPERATE code is valid');
      console.log('✅ Discount:', data.discountValue, data.discountType);
    } else {
      console.log('❌ CORPERATE code is invalid');
      console.log('Error:', data.error || data.message);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testPromoCode();
