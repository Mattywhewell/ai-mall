'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';



type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  tags?: string[];
};

export default function MicrostorePage() {
  const { slug } = useParams() as { slug: string };
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      console.log("Slug value:", slug);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('microstore_id', slug);

      console.log("Query result:", data);
      console.log("Query error:", error);

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
      }

      setLoading(false);
    }

    fetchProducts();
  }, [slug]);

  if (loading) {
    return (
      <main style={{ padding: '2rem' }}>
        <h2>Loading products…</h2>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        Products in {slug}
      </h1>

      {products.length === 0 && (
        <p>No products found for this microstore.</p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '1rem',
              width: '250px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p><strong>£{product.price}</strong></p>

            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                style={{
                  width: '100%',
                  borderRadius: '4px',
                  marginTop: '0.5rem'
                }}
              />
            )}
          </div>
        ))}
      </div>
    </main>
  );
}