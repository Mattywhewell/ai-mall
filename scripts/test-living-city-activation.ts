import fetch from 'node-fetch';

async function testLivingCityActivation() {
  console.log('🚀 Testing Living City Engine Activation...');

  try {
    const response = await fetch('http://localhost:3000/api/world/evolution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job: 'living-city'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Living City Engine activated:', result);
    } else {
      console.log('❌ Failed to activate:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testLivingCityActivation();