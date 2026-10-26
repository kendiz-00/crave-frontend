// Test Render production backend
const testRenderProduction = async () => {
  console.log('Testing Render production backend...');

  try {
    const response = await fetch('https://crave-backend.onrender.com/api/simple-promo/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'CORPERATE',
      }),
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);

    if (response.ok) {
      const data = JSON.parse(text);
      console.log('✅ Route deployed successfully');
      console.log('Data:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Route not deployed or error');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

testRenderProduction();
