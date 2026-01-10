'use client';

import { useState } from 'react';
import { X, ShoppingCart, Heart, Share2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ShopTourViewerProps {
  shopId: string;
  onClose: () => void;
}

interface ShopData {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  reviewCount: number;
  products: Product[];
  tourId: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  inStock: boolean;
}

// Mock shop data - in production this would come from API
const mockShopData: Record<string, ShopData> = {
  'memory-bazaar': {
    id: 'memory-bazaar',
    name: 'Memory Bazaar',
    category: 'Digital Art',
    description: 'A curated collection of digital memories, artwork, and collectibles that capture moments in time.',
    rating: 4.8,
    reviewCount: 127,
    tourId: 'sample-tour-1',
    products: [
      {
        id: 'digital-memory-1',
        name: 'Sunset Memory',
        price: 29.99,
        image: '/images/products/digital-art-1.jpg',
        description: 'A beautiful digital capture of a perfect sunset moment.',
        inStock: true
      },
      {
        id: 'digital-memory-2',
        name: 'Ocean Waves',
        price: 34.99,
        image: '/images/products/digital-art-2.jpg',
        description: 'Ethereal waves captured in perfect digital form.',
        inStock: true
      }
    ]
  },
  'loomworks': {
    id: 'loomworks',
    name: 'Loomworks',
    category: 'Textiles',
    description: 'Handcrafted textiles and woven goods made with traditional techniques and modern design.',
    rating: 4.6,
    reviewCount: 89,
    tourId: 'sample-tour-2',
    products: [
      {
        id: 'textile-1',
        name: 'Woven Blanket',
        price: 89.99,
        image: '/images/products/textile-1.jpg',
        description: 'Soft, hand-woven blanket with traditional patterns.',
        inStock: true
      }
    ]
  },
  'garden-hearts': {
    id: 'garden-hearts',
    name: 'Garden of Hearts',
    category: 'Wellness',
    description: 'Natural wellness products and healing items from nature\'s own pharmacy.',
    rating: 4.9,
    reviewCount: 203,
    tourId: 'sample-tour-3',
    products: [
      {
        id: 'wellness-1',
        name: 'Herbal Tea Blend',
        price: 24.99,
        image: '/images/products/wellness-1.jpg',
        description: 'Calming herbal tea blend for relaxation and wellness.',
        inStock: true
      }
    ]
  },
  'harbor-echoes': {
    id: 'harbor-echoes',
    name: 'Harbor Echoes',
    category: 'Audio',
    description: 'Unique sounds, musical instruments, and audio experiences from around the world.',
    rating: 4.7,
    reviewCount: 156,
    tourId: 'sample-tour-4',
    products: [
      {
        id: 'audio-1',
        name: 'Crystal Singing Bowl',
        price: 149.99,
        image: '/images/products/audio-1.jpg',
        description: 'Handcrafted crystal singing bowl for meditation and sound therapy.',
        inStock: true
      }
    ]
  }
};

export function ShopTourViewer({ shopId, onClose }: ShopTourViewerProps) {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const shopData = mockShopData[shopId];

  if (!shopData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <h2 className="text-xl font-bold mb-4">Shop Not Found</h2>
          <p className="text-gray-600 mb-4">Sorry, we couldn't find that shop.</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">{shopData.name}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="secondary">{shopData.category}</Badge>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{shopData.rating}</span>
                <span className="text-sm text-gray-500">({shopData.reviewCount} reviews)</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex h-[600px]">
          {/* 3D Tour Section */}
          <div className="flex-1 bg-gray-100 relative">
            {/* Placeholder for Matterport viewer */}
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
              <div className="text-center">
                <div className="text-6xl mb-4">🏪</div>
                <h3 className="text-xl font-semibold mb-2">3D Shop Tour</h3>
                <p className="text-gray-600 mb-4">
                  Interactive tour of {shopData.name}
                </p>
                <Badge variant="outline" className="text-sm">
                  Tour ID: {shopData.tourId}
                </Badge>
                <p className="text-xs text-gray-500 mt-2">
                  (Matterport integration coming soon)
                </p>
              </div>
            </div>

            {/* Tour Controls Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-2">
              <Button variant="secondary" size="sm">
                🏠 Lobby
              </Button>
              <Button variant="secondary" size="sm">
                🎨 Gallery
              </Button>
              <Button variant="secondary" size="sm">
                💰 Checkout
              </Button>
            </div>
          </div>

          {/* Product Sidebar */}
          <div className="w-80 border-l bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-3">Featured Products</h3>
              <div className="space-y-3">
                {shopData.products.map((product) => (
                  <div
                    key={product.id}
                    className={`bg-white rounded-lg p-3 border cursor-pointer transition-colors ${
                      selectedProduct === product.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedProduct(product.id)}
                  >
                    <div className="flex space-x-3">
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">📦</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{product.name}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-green-600">${product.price}</span>
                          <Badge variant={product.inStock ? "default" : "secondary"} className="text-xs">
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shop Description */}
              <div className="mt-6 p-3 bg-white rounded-lg border">
                <h4 className="font-medium mb-2">About {shopData.name}</h4>
                <p className="text-sm text-gray-600">{shopData.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                <Button className="w-full" size="sm">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Visit Shop Page
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Heart className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}