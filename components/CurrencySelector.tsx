/**
 * Currency Selector Component
 * Allows users to manually override their detected country/currency
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { COUNTRY_TO_CURRENCY, getCurrencyForCountry } from '@/lib/currency';

export function CurrencySelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentCountry, setCurrentCountry] = useState('US');
  
  useEffect(() => {
    // Read current country from cookie
    const cookies = document.cookie.split(';');
    const countryCookie = cookies.find(c => c.trim().startsWith('user-country='));
    if (countryCookie) {
      setCurrentCountry(countryCookie.split('=')[1].trim());
    }
  }, []);
  
  const router = useRouter();

  const handleCountryChange = (country: string) => {
    // Update cookie
    document.cookie = `user-country=${country}; path=/; max-age=${60 * 60 * 24 * 30}`;
    setCurrentCountry(country);
    setIsOpen(false);
    
    // Refresh to apply new currency
    try {
      router.refresh();
    } catch (err) {
      if (typeof window !== 'undefined') window.location.reload();
    }
  };

  const currentCurrency = getCurrencyForCountry(currentCountry);

  // Popular countries for quick access
  const popularCountries = ['US', 'GB', 'CA', 'AU', 'EU', 'JP', 'IN', 'SG'];
  const popularEntries = popularCountries
    .map(code => {
      if (code === 'EU') {
        return { code: 'DE', name: 'Europe (EUR)', currency: 'EUR' };
      }
      const currency = COUNTRY_TO_CURRENCY[code];
      return { code, currency };
    });
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition"
        aria-label="Change currency"
      >
        <Globe className="h-4 w-4" />
        <span className="font-medium">{currentCurrency.symbol} {currentCurrency.code}</span>
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Select Your Region</h3>
              <p className="text-xs text-gray-500 mt-1">Prices will update automatically</p>
            </div>
            
            <div className="p-2">
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-500 px-2 py-1">POPULAR</p>
                {popularEntries.map(({ code, currency, name }) => {
                  const curr = getCurrencyForCountry(code);
                  return (
                    <button
                      key={code}
                      onClick={() => handleCountryChange(code)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition ${
                        currentCountry === code ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span className="font-medium">{curr.symbol}</span> {curr.code}
                      {name && <span className="text-xs ml-1">({name})</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
              <p>Currency rates are updated daily. Checkout uses live rates.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
