'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '@/lib/auth/AuthContext';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/store/cartStore';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2, Share2, TrendingDown } from 'lucide-react';

export default function WishlistPage() {
  const { user } = useAuth();
  const { addItem } = useCartStore();
  const [wishlistItems, setWishlistItems] = useState<(Product & { wishlist_id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      // Fetch wishlist items with product details
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          id,
          product_id,
          products (*)
        `)
        .eq('user_id', user?.id);

      if (error) throw error;

      const items = data?.map((item: any) => ({
        ...item.products,
        wishlist_id: item.id,
      })) || [];

      setWishlistItems(items);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistId: string) => {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', wishlistId);

      if (error) throw error;
      
      setWishlistItems(wishlistItems.filter(item => item.wishlist_id !== wishlistId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      alert('Failed to remove item');
    }
  };

  const addAllToCart = () => {
    wishlistItems.forEach(product => {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.image_url || '/placeholder.png',
        microstoreId: product.microstore_id || '',
      });
    });
    alert(`Added ${wishlistItems.length} items to cart!`);
  };

  const shareWishlist = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share && url) {
      try {
        await navigator.share({
          title: 'My Wishlist',
          text: 'Check out my wishlist on Aiverse!',
          url,
        });
      } catch (err) {
        // ignore
      }
    } else if (url && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      alert('Wishlist link copied to clipboard!');
    } else {
      alert('Share not available in this environment.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-16">
        <div className="text-center max-w-md">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view your wishlist</h1>
          <p className="text-gray-600 mb-6">
            Save your favorite products and get notified of price drops
          </p>
          <Link
            href="/auth/signin"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Heart className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your wishlist is empty</h1>
            <p className="text-gray-600 mb-8">
              Start adding products you love to keep track of them
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
            <p className="text-gray-600">{wishlistItems.length} items saved</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={shareWishlist}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            <button
              onClick={addAllToCart}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add All to Cart</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((product) => (
            <div
              key={product.wishlist_id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group relative"
            >
              <Link href={`/products/${product.id}`} className="block">
                <div className="relative h-48 bg-gray-100">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ShoppingCart className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Price Drop Badge */}
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center space-x-1">
                      <TrendingDown className="w-3 h-3" />
                      <span>Price Drop!</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-purple-600">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="ml-2 text-sm text-gray-500 line-through">
                          ${product.compare_at_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>

              {/* Action Buttons */}
              <div className="p-4 pt-0 flex space-x-2">
                <button
                  onClick={() => {
                    addItem({
                      productId: product.id,
                      name: product.name,
                      price: product.price,
                      quantity: 1,
                      imageUrl: product.image_url || '/placeholder.png',
                      microstoreId: product.microstore_id || '',
                    });
                    alert('Added to cart!');
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
                <button
                  onClick={() => removeFromWishlist(product.wishlist_id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
