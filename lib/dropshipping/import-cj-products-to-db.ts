import { fetchCJAutolistProducts } from '@/lib/dropshipping/fetch-cj-autolist-products';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * Import products from CJdropshipping for a supplier and add to local database.
 */
export async function importCJProductsToDB(supplierId: string) {
  const supabase = getSupabaseClient();

  // Fetch products from CJdropshipping
  const cjResponse = await fetchCJAutolistProducts(supplierId);
  if (!cjResponse || !cjResponse.data) throw new Error('No products returned from CJdropshipping');

  let imported = 0;
  const errors: string[] = [];

  for (const product of cjResponse.data.products || []) {
    try {
      // Map CJ product fields to your local schema as needed
      const { name, description, price, category, images, sku, inStock } = product;
      const { error } = await supabase.from('products').insert({
        name,
        description,
        price,
        category,
        supplier_id: supplierId,
        image_url: images?.[0] || null,
        tags: [],
        stock_quantity: inStock ? 100 : 0,
        active: true,
        metadata: {
          cj_sku: sku,
          cj_imported: true,
          imported_at: new Date().toISOString(),
          original_images: images
        }
      });
      if (!error) imported++;
      else errors.push(`Failed to import ${name}: ${error.message}`);
    } catch (err) {
      errors.push(`Error importing product: ${err}`);
    }
  }
  return { productsImported: imported, errors };
}
