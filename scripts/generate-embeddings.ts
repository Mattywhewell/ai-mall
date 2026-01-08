// Script to generate embeddings for all existing products
// This is a one-time migration script

import { supabase } from '../lib/supabaseClient';
import { generateProductEmbedding, updateProductEmbedding } from '../lib/ai/semanticSearch';

async function generateEmbeddingsForAllProducts() {
  console.log('Starting embedding generation for all products...');

  try {
    // Fetch all products
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, description, tags');

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    if (!products || products.length === 0) {
      console.log('No products found.');
      return;
    }

    console.log(`Found ${products.length} products. Generating embeddings...`);

    let successCount = 0;
    let failCount = 0;

    // Process products one by one (to avoid rate limits)
    for (const product of products) {
      try {
        console.log(`Processing: ${product.name}...`);
        
        const embedding = await generateProductEmbedding(
          product.name,
          product.description || '',
          product.tags || []
        );

        const success = await updateProductEmbedding(product.id, embedding);

        if (success) {
          successCount++;
          console.log(`✓ Successfully generated embedding for: ${product.name}`);
        } else {
          failCount++;
          console.log(`✗ Failed to update embedding for: ${product.name}`);
        }

        // Add a small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        failCount++;
        console.error(`Error processing ${product.name}:`, error);
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total products: ${products.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failCount}`);
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// Run the script
generateEmbeddingsForAllProducts()
  .then(() => {
    console.log('Script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
