import { supabase } from '../lib/supabaseClient';
import { Microstore } from '@/lib/types';
import { Sparkles, Building2, Store, Zap, Globe, Cpu, Heart, ShoppingBag, TrendingUp, User } from 'lucide-react';
import Link from 'next/link';

import Hero from '@/components/Hero';
import CityIntro from '@/components/CityIntro';
import DistrictsSection from '@/components/DistrictsSection';
import CitizensSection from '@/components/CitizensSection';
import CreatorInvitation from '@/components/CreatorInvitation';
import ClosingRitual from '@/components/ClosingRitual';

// District icon mapping
const districtIcons: Record<string, any> = {
  electronics: Cpu,
  fashion: Heart,
  home: Building2,
  beauty: Sparkles,
  sports: Zap,
  books: Store,
  food: Store,
  toys: ShoppingBag,
  default: Store,
};

const getDistrictIcon = (category: string) => {
  const IconComponent = districtIcons[category.toLowerCase()] || districtIcons.default;
  return IconComponent;
};

async function getMicrostores(): Promise<Microstore[]> {
  try {
    const { data, error } = await supabase
      .from('microstores')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching microstores:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error fetching microstores:', err);
    return [];
  }
}

export default async function HomePage() {
  const microstores = await getMicrostores();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 animate-pulse"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="flex justify-end mb-6">
            <Link href="/login" aria-label="Account" className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-full">
              <User className="w-6 h-6 text-white" />
              <span className="sr-only">Account</span>
            </Link>
          </div>
          <div className="text-center">
            {/* Logo with icon */}
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-purple-300 mr-4" />
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 bg-clip-text text-transparent">
                Aiverse
              </h1>
            </div>
            
            {/* Replace with modular components */}
            <Hero />
            <CityIntro />
            <DistrictsSection />
            <CitizensSection />
            <CreatorInvitation />
            <ClosingRitual />

            {/* Dynamic microstores grid follows */}
        
        {microstores.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">The districts are awakening...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {microstores.map((store) => {
              const IconComponent = getDistrictIcon(store.category);
              return (
                <Link
                  key={store.id}
                  href={`/districts/${store.slug}`}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl group-hover:from-purple-200 group-hover:to-indigo-200 transition-colors">
                          <IconComponent className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                          {store.name}
                        </h3>
                      </div>
                      <svg
                        className="w-6 h-6 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">{store.description}</p>
                    <span className="inline-block px-3 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 rounded-full text-sm font-medium">
                      {store.category}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p>AI-Native Mall - Your Next-Generation Shopping Experience</p>
        </div>
      </footer>
    </div>
  );
}