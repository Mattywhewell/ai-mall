'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Navigation, X, Eye, EyeOff } from 'lucide-react';

interface MiniMapProps {
  currentDistrict?: string;
  currentHall?: string;
  currentStreet?: string;
}

export default function MiniMap({ currentDistrict, currentHall, currentStreet }: MiniMapProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  // Auto-show on district/product pages
  useEffect(() => {
    const isDistrictPage = pathname.includes('/districts/');
    const isProductPage = pathname.includes('/products/');
    setIsVisible(isDistrictPage || isProductPage);
  }, [pathname]);

  if (!isVisible) return null;

  const navigationOptions = [
    { name: 'City Gate', href: '/city', icon: '🏛️' },
    { name: 'Living Map', href: '/ai-city/explore', icon: '🗺️' },
    { name: 'Commons', href: '/commons', icon: '🌐' },
    { name: 'Creator Hub', href: '/creator', icon: '🎨' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Mini Map Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
        title="Toggle City Mini-Map"
      >
        {isExpanded ? <EyeOff size={20} /> : <Navigation size={20} />}
      </button>

      {/* Expanded Mini Map */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 min-w-80 animate-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin size={16} className="text-indigo-600" />
              City Navigation
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          {/* Current Location */}
          {(currentDistrict || currentHall || currentStreet) && (
            <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
              <div className="text-sm font-medium text-indigo-900 mb-1">Current Location</div>
              <div className="text-xs text-indigo-700 space-y-1">
                {currentStreet && <div>📍 {currentStreet}</div>}
                {currentHall && <div>🏛️ {currentHall}</div>}
                {currentDistrict && <div>🏪 {currentDistrict}</div>}
              </div>
            </div>
          )}

          {/* Navigation Options */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 mb-2">Quick Navigation</div>
            {navigationOptions.map((option) => (
              <Link
                key={option.href}
                href={option.href}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <span className="text-lg">{option.icon}</span>
                <span className="text-sm text-gray-700 group-hover:text-indigo-600">
                  {option.name}
                </span>
              </Link>
            ))}
          </div>

          {/* City Pulse Indicator */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>City Pulse</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}