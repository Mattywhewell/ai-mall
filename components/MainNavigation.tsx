/**
 * Main Navigation Bar
 * Includes logo, links, cart, and currency selector
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Compass, ShoppingBag, Sparkles, TrendingUp, Search } from 'lucide-react';
import { CartIcon } from './CartIcon';
import { CurrencySelector } from './CurrencySelector';
import UserMenu from './UserMenu';
import { NotificationCenter } from './NotificationCenter';
import { useAuth } from '@/lib/auth/AuthContext';

export function MainNavigation() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(false);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-gray-900">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <span>AI Mall</span>
          </Link>
          
          {/* Main Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-1 text-gray-700 hover:text-purple-600 transition-colors">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            <Link href="/city" className="flex items-center space-x-1 text-gray-700 hover:text-purple-600 transition-colors">
              <Compass className="w-4 h-4" />
              <span>Explore</span>
            </Link>

            <Link href="/agents" className="flex items-center space-x-1 text-gray-700 hover:text-purple-600 transition-colors">
              <Sparkles className="w-4 h-4" />
              <span>Agents</span>
            </Link>

            <Link href="/events" className="flex items-center space-x-1 text-gray-700 hover:text-purple-600 transition-colors">
              <TrendingUp className="w-4 h-4" />
              <span>Events</span>
            </Link>

            <Link href="/subscriptions" className="flex items-center space-x-1 text-gray-700 hover:text-purple-600 transition-colors">
              <ShoppingBag className="w-4 h-4" />
              <span>Subscriptions</span>
            </Link>

            <Link href="/digital-products" className="flex items-center space-x-1 text-gray-700 hover:text-purple-600 transition-colors">
              <Sparkles className="w-4 h-4" />
              <span>Create</span>
            </Link>

            <Link href="/about" className="flex items-center space-x-1 text-gray-700 hover:text-purple-600 transition-colors">
              <span>About</span>
            </Link>
          </div>
          
          {/* Right Side: Search, Currency, Cart, User */}
          <div className="flex items-center space-x-4">
            {/* Search Toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-700 hover:text-purple-600 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            
            <CurrencySelector />
            <NotificationCenter />
            <CartIcon />
            <UserMenu />
          </div>
        </div>
        
        {/* Search Bar Dropdown */}
        {showSearch && (
          <div className="px-4 pb-4">
            <form onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, districts, or ask AI..."
                  className="w-full px-4 py-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}
