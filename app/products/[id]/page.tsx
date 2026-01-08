'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { Product, Microstore } from '@/lib/types';
import { useCartStore } from '@/lib/store/cartStore';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, ShoppingCart, Heart, Share2, Store, TrendingUp, 
  Check, Minus, Plus, ChevronLeft, MapPin, Package, RotateCcw, Shield
} from 'lucide-react';

type Review = {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  helpful_count: number;
  verified_purchase: boolean;
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = (params?.id as string) || '';
  
  const { addItem } = useCartStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [microstore, setMicrostore] = useState<Microstore | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    async function fetchProductData() {
      try {
        setLoading(true);

        // Fetch product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (productError) throw productError;
        setProduct(productData);

        // Fetch microstore
        if (productData.microstore_id) {
          const { data: storeData } = await supabase
            .from('microstores')
            .select('*')
            .eq('id', productData.microstore_id)
            .single();
          setMicrostore(storeData);
        }

        // Fetch related products (same category)
        const { data: relatedData } = await supabase
          .from('products')
          .select('*')
          .eq('category', productData.category)
          .neq('id', productId)
          .limit(4);
        setRelatedProducts(relatedData || []);

        // Fetch reviews (mock data for now)
        setReviews([
          {
            id: '1',
            user_name: 'Sarah Johnson',
            rating: 5,
            comment: 'Absolutely love this product! Exceeded my expectations. The quality is outstanding.',
            created_at: '2026-01-03',
            helpful_count: 12,
            verified_purchase: true,
          },
          {
            id: '2',
            user_name: 'Michael Chen',
            rating: 4,
            comment: 'Great product overall. Shipping was fast and packaging was excellent.',
            created_at: '2026-01-02',
            helpful_count: 8,
            verified_purchase: true,
          },
          {
            id: '3',
            user_name: 'Emily Rodriguez',
            rating: 5,
            comment: 'This is my third purchase from this seller. Never disappoints!',
            created_at: '2025-12-28',
            helpful_count: 15,
            verified_purchase: true,
          },
        ]);

        // Track product view
        await supabase.from('analytics').insert({
          event_type: 'product_view',
          product_id: productId,
          microstore_id: productData.microstore_id,
        });

      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProductData();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      imageUrl: product.image_url || '/placeholder.png',
      microstoreId: product.microstore_id || '',
    });
    alert(`Added ${quantity} ${product.name}(s) to cart!`);
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    // TODO: Save to database
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share && url) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url,
        });
      } catch (err) {
        // ignore user cancel
      }
    } else if (url && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } else {
      alert('Share not available in this environment.');
    }
  };

  const images = product?.image_url ? [product.image_url, product.image_url, product.image_url] : [];
  const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <Link href="/" className="text-purple-600 hover:text-purple-700">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-purple-600">Home</Link>
            <ChevronLeft className="w-4 h-4 rotate-180 text-gray-400" />
            {microstore && (
              <>
                <Link href={`/districts/${microstore.slug}`} className="text-gray-600 hover:text-purple-600">
                  {microstore.name}
                </Link>
                <ChevronLeft className="w-4 h-4 rotate-180 text-gray-400" />
              </>
            )}
            <span className="text-gray-900">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
              <div className="relative h-96 lg:h-[500px]">
                {images.length > 0 ? (
                  <Image
                    src={images[selectedImage]}
                    alt={product.name}
                    fill
                    className="object-contain p-8"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <ShoppingCart className="w-24 h-24 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === idx ? 'border-purple-600' : 'border-gray-200'
                    }`}
                  >
                    <Image src={img} alt={`View ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(avgRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600">
                {avgRating.toFixed(1)} ({reviews.length} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <span className="text-4xl font-bold text-purple-600">
                ${product.price.toFixed(2)}
              </span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="ml-3 text-xl text-gray-500 line-through">
                  ${product.compare_at_price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-700 leading-relaxed mb-6">{product.description}</p>

            {/* Stock Status */}
            <div className="flex items-center space-x-2 mb-6">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-600 font-medium">In Stock - Ships within 24 hours</span>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center space-x-2 bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Add to Cart</span>
              </button>
              <button
                onClick={handleWishlist}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  isWishlisted
                    ? 'border-red-500 bg-red-50 text-red-600'
                    : 'border-gray-300 hover:border-red-500 hover:text-red-600'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-4 rounded-lg border-2 border-gray-300 hover:border-purple-500 hover:text-purple-600 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Seller Info */}
            {microstore && (
              <Link
                href={`/districts/${microstore.slug}`}
                className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Store className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sold by</p>
                  <p className="font-bold text-gray-900">{microstore.name}</p>
                </div>
              </Link>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Package className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-gray-700">Free Shipping</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <RotateCcw className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-gray-700">30-Day Returns</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <p className="text-xs text-gray-700">Secure Payment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Write a Review
            </button>
          </div>

          {showReviewForm && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Your Review</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="p-1"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= reviewForm.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Share your experience with this product..."
                />
              </div>
              <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Submit Review
              </button>
            </div>
          )}

          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-gray-900">{review.user_name}</span>
                      {review.verified_purchase && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{review.created_at}</span>
                </div>
                <p className="text-gray-700 mb-3">{review.comment}</p>
                <button className="text-sm text-gray-600 hover:text-purple-600">
                  Helpful ({review.helpful_count})
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/products/${relatedProduct.id}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                >
                  <div className="relative h-48 bg-gray-100">
                    {relatedProduct.image_url ? (
                      <Image
                        src={relatedProduct.image_url}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ShoppingCart className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                      {relatedProduct.name}
                    </h3>
                    <span className="text-lg font-bold text-purple-600">
                      ${relatedProduct.price.toFixed(2)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
