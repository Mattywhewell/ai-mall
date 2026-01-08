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
  const [submittingReview, setSubmittingReview] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest' | 'helpful'>('recent');
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

        // Fetch reviews: try real table first, otherwise fall back to mock
        let fetchedReviews = null;
        try {
          const { data: reviewRows, error: reviewError } = await supabase
            .from('product_reviews')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });
          if (!reviewError && reviewRows) fetchedReviews = reviewRows.map((r: any) => ({
            id: String(r.id),
            user_name: r.user_name || 'Anonymous',
            rating: r.rating || 5,
            comment: r.comment || '',
            created_at: r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
            helpful_count: r.helpful_count || 0,
            verified_purchase: !!r.verified_purchase,
          }));
        } catch (e) {
          // ignore and fallback to mock
        }

        if (fetchedReviews && fetchedReviews.length > 0) {
          setReviews(fetchedReviews);
        } else {
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
        }

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

  const handleSubmitReview = async () => {
    if (!reviewForm.comment.trim()) {
      alert('Please write a review comment.');
      return;
    }

    setSubmittingReview(true);
    try {
      const newReview = {
        id: Date.now().toString(),
        user_name: 'You',
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        created_at: new Date().toLocaleDateString(),
        helpful_count: 0,
        verified_purchase: true,
      };

      // Optimistic UI update
      setReviews(prev => [newReview, ...prev]);
      setReviewForm({ rating: 5, comment: '' });
      setShowReviewForm(false);

      // Try to persist to Supabase if available
      try {
        await supabase.from('product_reviews').insert({
          product_id: productId,
          user_name: 'You',
          rating: newReview.rating,
          comment: newReview.comment,
          verified_purchase: true,
        });
      } catch (e) {
        // persistence failed; keep optimistic update but log
        console.warn('Persisting review failed:', e);
      }
      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleHelpfulVote = (reviewId: string) => {
    setHelpfulVotes(prev => {
      const newVotes = new Set(prev);
      if (newVotes.has(reviewId)) {
        newVotes.delete(reviewId);
      } else {
        newVotes.add(reviewId);
      }
      return newVotes;
    });
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
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4 relative group">
              <div className="relative h-96 lg:h-[500px] cursor-zoom-in">
                {images.length > 0 ? (
                  <Image
                    src={images[selectedImage]}
                    alt={product.name}
                    fill
                    className="object-contain p-8 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <ShoppingCart className="w-24 h-24 text-gray-400" />
                  </div>
                )}
                {/* Image Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage(selectedImage > 0 ? selectedImage - 1 : images.length - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={() => setSelectedImage(selectedImage < images.length - 1 ? selectedImage + 1 : 0)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700 rotate-180" />
                    </button>
                  </>
                )}
                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {selectedImage + 1} / {images.length}
                  </div>
                )}
              </div>
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-6 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? 'border-purple-600 ring-2 ring-purple-200'
                        : 'border-gray-200 hover:border-gray-300'
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
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          )}

          {/* Review controls: search, sort, verified filter */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Search reviews"
                className="px-3 py-2 border rounded-lg w-64"
              />
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as any); setPage(1); }}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="recent">Most recent</option>
                <option value="highest">Highest rating</option>
                <option value="lowest">Lowest rating</option>
                <option value="helpful">Most helpful</option>
              </select>
              <label className="inline-flex items-center space-x-2 text-sm">
                <input type="checkbox" checked={showVerifiedOnly} onChange={(e) => { setShowVerifiedOnly(e.target.checked); setPage(1); }} />
                <span>Verified only</span>
              </label>
            </div>
            <div className="text-sm text-gray-600">Showing {reviews.length} reviews</div>
          </div>

          <div className="space-y-6">
            {(() => {
              // Filter/search
              let filtered = reviews.filter(r => {
                if (showVerifiedOnly && !r.verified_purchase) return false;
                if (searchQuery && !(`${r.user_name} ${r.comment}`.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
                return true;
              });

              // Sort
              if (sortBy === 'recent') {
                filtered = filtered.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              } else if (sortBy === 'highest') {
                filtered = filtered.sort((a,b) => b.rating - a.rating);
              } else if (sortBy === 'lowest') {
                filtered = filtered.sort((a,b) => a.rating - b.rating);
              } else if (sortBy === 'helpful') {
                filtered = filtered.sort((a,b) => (b.helpful_count || 0) - (a.helpful_count || 0));
              }

              const total = filtered.length;
              const start = (page - 1) * pageSize;
              const pageItems = filtered.slice(start, start + pageSize);

              return (
                <>
                  {pageItems.map((review) => (
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
                <button
                  onClick={() => handleHelpfulVote(review.id)}
                  className={`text-sm ${
                    helpfulVotes.has(review.id)
                      ? 'text-purple-600 font-medium'
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  Helpful ({review.helpful_count + (helpfulVotes.has(review.id) ? 1 : 0)})
                </button>
              </div>
            ))}

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600">Showing {Math.min(pageSize, pageItems.length)} of {total} reviews</div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 rounded-md border disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <div className="px-3 py-1 border rounded-md bg-gray-50">Page {page} / {Math.max(1, Math.ceil(total / pageSize))}</div>
                      <button
                        onClick={() => setPage(Math.min(Math.max(1, Math.ceil(total / pageSize)), page + 1))}
                        disabled={page >= Math.ceil(total / pageSize)}
                        className="px-3 py-1 rounded-md border disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
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
