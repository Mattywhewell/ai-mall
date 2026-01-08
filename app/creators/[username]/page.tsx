'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/auth/AuthContext';
import { Product, Microstore } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { 
  User, MapPin, Star, ShoppingBag, Heart, ExternalLink, 
  MessageCircle, Share2, Award, TrendingUp, Package
} from 'lucide-react';

type CreatorProfile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  social_links: any;
  stats: {
    followers: number;
    products_sold: number;
    rating: number;
    total_reviews: number;
  };
};

export default function CreatorProfilePage() {
  const params = useParams();
  const username = (params?.username as string) || '';
  const { user } = useAuth();

  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [districts, setDistricts] = useState<Microstore[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'districts' | 'about'>('products');

  useEffect(() => {
    fetchCreatorData();
  }, [username]);

  const fetchCreatorData = async () => {
    try {
      setLoading(true);

      // Mock creator data - replace with actual API
      const mockCreator: CreatorProfile = {
        id: '123',
        username: username,
        full_name: 'Alex Rodriguez',
        avatar_url: null,
        bio: 'Passionate creator bringing unique products and experiences to Aiverse. Specializing in sustainable fashion and eco-friendly home goods. Join me on this journey!',
        location: 'San Francisco, CA',
        website: 'https://example.com',
        social_links: {
          twitter: 'alexrod',
          instagram: 'alexrod_creates',
        },
        stats: {
          followers: 2847,
          products_sold: 1250,
          rating: 4.8,
          total_reviews: 342,
        },
      };

      setCreator(mockCreator);

      // Fetch creator's products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', mockCreator.id)
        .order('created_at', { ascending: false })
        .limit(12);

      setProducts(productsData || []);

      // Fetch creator's districts
      const { data: districtsData } = await supabase
        .from('microstores')
        .select('*')
        .eq('vendor_id', mockCreator.id);

      setDistricts(districtsData || []);

    } catch (error) {
      console.error('Error fetching creator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // TODO: Save to database
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share && url) {
      try {
        await navigator.share({
          title: `${creator?.full_name} on Aiverse`,
          text: creator?.bio || '',
          url,
        });
      } catch (err) {
        // ignore
      }
    } else if (url && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      alert('Profile link copied!');
    } else {
      alert('Share not available in this environment.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Creator Not Found</h1>
          <Link href="/" className="text-purple-600 hover:text-purple-700">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Cover */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 h-48"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Section */}
        <div className="relative -mt-24 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg">
                  {creator.avatar_url ? (
                    <Image
                      src={creator.avatar_url}
                      alt={creator.full_name}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    creator.full_name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-purple-600 rounded-full p-2">
                  <Award className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{creator.full_name}</h1>
                <p className="text-gray-600 mb-2">@{creator.username}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                  {creator.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{creator.location}</span>
                    </div>
                  )}
                  {creator.website && (
                    <a
                      href={creator.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-purple-600 hover:text-purple-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Website</span>
                    </a>
                  )}
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 mb-4">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">
                      {creator.stats.followers.toLocaleString()}
                    </span>
                    <p className="text-sm text-gray-600">Followers</p>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-gray-900">
                      {creator.stats.products_sold.toLocaleString()}
                    </span>
                    <p className="text-sm text-gray-600">Products Sold</p>
                  </div>
                  <div>
                    <div className="flex items-center space-x-1">
                      <span className="text-2xl font-bold text-gray-900">
                        {creator.stats.rating.toFixed(1)}
                      </span>
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    </div>
                    <p className="text-sm text-gray-600">
                      {creator.stats.total_reviews} reviews
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-2 w-full md:w-auto">
                <button
                  onClick={handleFollow}
                  className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFollowing ? 'fill-current' : ''}`} />
                  <span>{isFollowing ? 'Following' : 'Follow'}</span>
                </button>
                <div className="flex space-x-2">
                  <button
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 mx-auto" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-colors"
                  >
                    <Share2 className="w-5 h-5 mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm mb-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'products'
                ? 'bg-purple-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('districts')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'districts'
                ? 'bg-purple-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Districts ({districts.length})
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'about'
                ? 'bg-purple-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            About
          </button>
        </div>

        {/* Content */}
        <div className="pb-12">
          {activeTab === 'products' && (
            <div>
              {products.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No products yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                    >
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
                            <ShoppingBag className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                          {product.name}
                        </h3>
                        <span className="text-lg font-bold text-purple-600">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'districts' && (
            <div>
              {districts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No districts yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {districts.map((district) => (
                    <Link
                      key={district.id}
                      href={`/districts/${district.slug}`}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{district.name}</h3>
                      <p className="text-gray-600 line-clamp-3 mb-3">{district.description}</p>
                      <span className="text-sm text-purple-600">{district.category}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {creator.bio}
              </p>
              
              {creator.social_links && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Connect</h3>
                  <div className="flex space-x-4">
                    {creator.social_links.twitter && (
                      <a
                        href={`https://twitter.com/${creator.social_links.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Twitter
                      </a>
                    )}
                    {creator.social_links.instagram && (
                      <a
                        href={`https://instagram.com/${creator.social_links.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-700"
                      >
                        Instagram
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
