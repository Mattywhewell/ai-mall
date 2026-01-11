'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { Microstore, Product } from '@/lib/types';
import ProductGrid from '@/components/ProductGrid';
import { DistrictFilters } from '@/components/DistrictFilters';
import MiniMap from '@/components/MiniMap';
import PageTransition from '@/components/PageTransition';
import AICitizen from '@/components/AICitizen';
import Link from 'next/link';
import { MapPin, Sparkles } from 'lucide-react';

interface WorldContext {
  street: any;
  hall: any;
  aiSpirit: any;
}

export default function DistrictPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [microstore, setMicrostore] = useState<Microstore | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [worldContext, setWorldContext] = useState<WorldContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [userInteractions, setUserInteractions] = useState(0);

  useEffect(() => {
    async function fetchDistrictData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch microstore by slug
        const { data: microstoreData, error: microstoreError } = await supabase
          .from('microstores')
          .select('*')
          .eq('slug', slug)
          .single();

        if (microstoreError) {
          throw new Error('Microstore not found');
        }

        if (!microstoreData) {
          throw new Error('Microstore not found');
        }

        setMicrostore(microstoreData);

        // Fetch products for this microstore
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('microstore_id', microstoreData.id)
          .order('created_at', { ascending: false });

        if (productsError) {
          throw productsError;
        }

        setProducts(productsData || []);
        setFilteredProducts(productsData || []);

        // Fetch world architecture context
        try {
          const { data: streetData } = await supabase
            .from('streets')
            .select('*, halls(*)')
            .contains('districts', [microstoreData.district])
            .single();

          if (streetData) {
            // Get AI spirit for this district
            const { data: spiritData } = await supabase
              .from('ai_spirits')
              .select('*')
              .eq('entity_type', 'district')
              .eq('entity_id', microstoreData.id)
              .single();

            setWorldContext({
              street: streetData,
              hall: streetData.halls,
              aiSpirit: spiritData?.spirit_data || null
            });
          }
        } catch (err) {
          console.log('No world context found for this district');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching district data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchDistrictData();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading district...</p>
        </div>
      </div>
    );
  }

  if (error || !microstore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">District Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The district you are looking for does not exist.'}
          </p>
          <Link
            href="/"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <StructuredData microstore={microstore} slug={slug} />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm mb-4">
              <Link href="/city" className="text-indigo-600 hover:text-indigo-800">
                City
              </Link>
              {worldContext?.hall && (
                <>
                  <span className="text-gray-400">/</span>
                  <Link 
                    href={`/halls/${worldContext.hall.slug}`}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  {worldContext.hall.name}
                </Link>
              </>
            )}
            {worldContext?.street && (
              <>
                <span className="text-gray-400">/</span>
                <Link 
                  href={`/streets/${worldContext.street.slug}`}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  {worldContext.street.name}
                </Link>
              </>
            )}
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">{microstore.name}</span>
          </div>

          {/* District Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{microstore.name}</h1>
              <p className="text-lg text-gray-600 mb-4">{microstore.description}</p>
              
              <div className="flex items-center gap-3">
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  {microstore.category}
                </span>
                {worldContext?.street && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin size={16} />
                    <span>On {worldContext.street.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Spirit Greeting */}
            {worldContext?.aiSpirit && (
              <div className="ml-6 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl max-w-xs border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="text-purple-600" size={20} />
                  <span className="font-semibold text-purple-900">
                    {worldContext.aiSpirit.name}
                  </span>
                </div>
                <p className="text-sm text-purple-700 italic">
                  "{worldContext.aiSpirit.greeting}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <DistrictFilters 
          products={products}
          onFilteredProducts={setFilteredProducts}
        />
        <ProductGrid products={filteredProducts} />
      </div>

      {/* Persistent Mini Map */}
      <MiniMap
        currentDistrict={microstore.name}
        currentHall={worldContext?.hall?.name}
        currentStreet={worldContext?.street?.name}
      />

      {/* AI Citizen */}
      <AICitizen
        districtId={slug}
        userInteractions={userInteractions}
        onGuidance={(message) => console.log('AI Citizen guidance:', message)}
      />
      </div>
    </PageTransition>
  );
}