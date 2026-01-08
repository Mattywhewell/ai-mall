'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Microstore } from '@/lib/types';
import { Sparkles, Building2, Store, Zap, Globe, Cpu, Heart, ShoppingBag, TrendingUp, User } from 'lucide-react';
import { DistrictCardSkeleton } from '@/components/Skeletons';
import { SocialProof } from '@/components/SocialProof';
import { LiveActivityFeed } from '@/components/LiveActivityFeed';
import { RecentlyViewed } from '@/components/RecentlyViewed';

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

export default function HomePage() {
  const [microstores, setMicrostores] = useState<Microstore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function getSession() {
      try {
        // Allow a dev-only test session via ?test_user=true
        if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
          let params: URLSearchParams | undefined = undefined;
          try {
            params = new URLSearchParams(window.location.search);
          } catch {}
          if (params && params.get('test_user') === 'true') {
            console.log('DEV TEST USER: injecting mock session');
            const mock = {
              user: {
                id: 'test-id',
                email: 'test@example.com',
                user_metadata: { full_name: 'Test User' },
              },
            };
            setSession(mock);
            return;
          }
        }

        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data?.session ?? null);
      } catch (err) {
        console.error('Error getting auth session:', err);
      }
    }

    getSession();

    const { data: { subscription } = { subscription: undefined } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('click', onClick);
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
      if (typeof window !== 'undefined') {
        document.removeEventListener('click', onClick);
      }
    };
  }, [router]);

  useEffect(() => {
    async function fetchMicrostores() {
      try {
        // Check if Supabase is configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          throw new Error('Supabase environment variables are not configured. Please create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
        }

        const { data, error } = await supabase
          .from('microstores')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          // Supabase error format: {message, details, hint, code}
          const errorDetails = [
            error.message || 'Unknown database error',
            error.details ? `Details: ${error.details}` : '',
            error.hint ? `Hint: ${error.hint}` : '',
            error.code ? `Code: ${error.code}` : ''
          ].filter(Boolean).join(' | ');
          throw new Error(errorDetails);
        }

        setMicrostores(data || []);
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : (typeof err === 'object' && err !== null 
              ? JSON.stringify(err) 
              : 'An unknown error occurred');
        
        setError(errorMessage);
        
        // Enhanced error logging
        console.error('Error fetching microstores:', {
          message: errorMessage,
          errorType: err?.constructor?.name,
          fullError: err,
          errorKeys: err && typeof err === 'object' ? Object.keys(err) : [],
          stack: err instanceof Error ? err.stack : undefined
        });
      } finally {
        setLoading(false);
      }
    }

    fetchMicrostores();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-purple-300 animate-pulse mx-auto mb-4" />
          <p className="text-xl text-purple-200 animate-pulse">Awakening the Aiverse...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Districts</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

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
            {session?.user ? (
              <Link href="/profile" aria-label="Account" className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-full">
                <User className="w-6 h-6 text-white" />
                <span className="sr-only">Account</span>
              </Link>
            ) : (
              <Link href="/login" aria-label="Account" className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-full">
                <User className="w-6 h-6 text-white" />
                <span className="sr-only">Account</span>
              </Link>
            )}
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