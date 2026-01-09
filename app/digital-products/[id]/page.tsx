'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface DigitalProduct {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  price: number;
  currency: string;
  thumbnail_url: string;
  content_url: string;
  file_format: string;
  downloads: number;
  rating: number;
  tags: string[];
  generated_by: string;
  created_at: string;
}

export default function DigitalProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<DigitalProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [params?.id]);

  async function fetchProduct() {
    try {
      if (!params?.id) return;
      const res = await fetch(`/api/digital-products/generate?limit=100`);
      const data = await res.json();
      const found = data.products?.find((p: DigitalProduct) => p.id === params.id);
      setProduct(found || null);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase() {
    setPurchasing(true);
    try {
      const res = await fetch('/api/digital-products/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product?.id,
          user_email: prompt('Enter your email for instant delivery:'),
        }),
      });

      const data = await res.json();
      if (data.url) {
        if (typeof window !== 'undefined') {
          window.location.href = data.url;
        }
      } else {
        alert('Purchase failed: ' + data.error);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to initiate purchase');
    } finally {
      setPurchasing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Product Not Found</h1>
          <Link href="/digital-products" className="text-indigo-600 hover:underline">
            ← Back to Digital Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Back Link */}
        <Link
          href="/digital-products"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8"
        >
          ← Back to all products
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Left: Image */}
          <div className="space-y-6">
            <div className="relative bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl overflow-hidden aspect-square">
              {product.thumbnail_url && (
                <img
                  src={product.thumbnail_url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold mb-4">What's Included</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-700">Instant download after purchase</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-700">AI-generated, professionally designed</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-700">Fully editable and customizable</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-700">Lifetime access with no subscriptions</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right: Details */}
          <div className="space-y-6">
            {/* Type Badge */}
            <div className="inline-block bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium">
              {product.type.replace('_', ' ').toUpperCase()}
            </div>

            {/* Title & Description */}
            <div>
              <h1 className="text-4xl font-bold mb-4">{product.title}</h1>
              <p className="text-xl text-gray-600">{product.description}</p>
            </div>

            {/* Price & CTA */}
            <div className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-indigo-600">
                  ${product.price}
                </span>
                <span className="text-gray-500">one-time</span>
              </div>

              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg"
              >
                {purchasing ? 'Processing...' : 'Purchase & Download'}
              </button>

              <p className="text-sm text-gray-500 text-center">
                Secure payment via Stripe • Instant delivery
              </p>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-gray-500 mb-1">Format</div>
                <div className="font-semibold uppercase">{product.file_format}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-gray-500 mb-1">Downloads</div>
                <div className="font-semibold">{product.downloads.toLocaleString()}</div>
              </div>
              {product.rating > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-500 mb-1">Rating</div>
                  <div className="font-semibold">⭐ {product.rating.toFixed(1)}</div>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-gray-500 mb-1">Created</div>
                <div className="font-semibold">
                  {new Date(product.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-2">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Badge */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🤖</span>
                <span className="font-semibold">AI-Generated</span>
              </div>
              <p className="text-sm text-gray-600">
                This product was created using advanced AI (GPT-4) and is unique to Aiverse. 
                All content is original and ready to use immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
