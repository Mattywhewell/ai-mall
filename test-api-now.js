const fetch = require('node-fetch');

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/auto-listing/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_url: 'https://example-cj-product.com/item/123',
        supplier_id: 'cj_supplier_id_1'
      })
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers));
    const text = await response.text();
    console.log('Body:', text);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();