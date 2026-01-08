/**
 * Pricing Test Page
 * Test worldwide pricing with different countries
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { COUNTRY_TO_CURRENCY, CURRENCIES, getCurrencyForCountry } from '@/lib/currency';
import { convertPrice, formatPrice } from '@/lib/convertPrice';

export default function TestPricingPage() {
  const [testPrice] = useState(99.99);
  const [selectedCountry, setSelectedCountry] = useState('US');
  
  const testProducts = [
    { name: 'Moonstone Crystal', price: 32.00 },
    { name: 'Ritual Candle Set', price: 45.50 },
    { name: 'Meditation Journal', price: 28.99 },
    { name: 'Subscription Box', price: 149.99 },
  ];
  
  const testCountries = ['US', 'GB', 'CA', 'AU', 'DE', 'JP', 'IN', 'BR', 'MX', 'SG', 'KR', 'CN'];
  
  const router = useRouter();

  const handleSimulateCountry = (country: string) => {
    document.cookie = `user-country=${country}; path=/; max-age=${60 * 60 * 24 * 30}`;
    setSelectedCountry(country);
    setTimeout(() => router.refresh(), 100);
  };
  
  const currentCurrency = getCurrencyForCountry(selectedCountry);
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Worldwide Pricing Test Suite
        </h1>
        <p className="text-gray-600 mb-8">
          Test automatic currency conversion across 60+ countries
        </p>
        
        {/* Country Simulator */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Simulate Location</h2>
          <p className="text-gray-600 mb-4">
            Current: <span className="font-bold">{selectedCountry}</span> → {currentCurrency?.code} ({currentCurrency?.symbol})
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {testCountries.map(country => {
              const currency = getCurrencyForCountry(country);
              const isActive = country === selectedCountry;
              
              return (
                <button
                  key={country}
                  onClick={() => handleSimulateCountry(country)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isActive
                      ? 'border-purple-600 bg-purple-50 text-purple-900'
                      : 'border-gray-200 hover:border-purple-300 text-gray-700'
                  }`}
                >
                  <div className="text-lg font-bold">{country}</div>
                  <div className="text-xs">{currency?.code}</div>
                  <div className="text-sm font-semibold">{currency?.symbol}</div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Test Products */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Test Products</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {testProducts.map(product => {
              const converted = convertPrice(product.price, selectedCountry);
              
              return (
                <div key={product.name} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="text-gray-600">
                      USD Price: <span className="font-mono">${product.price.toFixed(2)}</span>
                    </div>
                    <div className="text-purple-600 font-bold text-xl">
                      {converted.formatted}
                    </div>
                    <div className="text-xs text-gray-500">
                      Rate: 1 USD = {converted.rate.toFixed(4)} {converted.code}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Conversion Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">
            ${testPrice.toFixed(2)} USD Across All Countries
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4">Country</th>
                  <th className="text-left py-3 px-4">Currency</th>
                  <th className="text-left py-3 px-4">Rate</th>
                  <th className="text-right py-3 px-4">Converted Price</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(COUNTRY_TO_CURRENCY).slice(0, 20).map(([country, currencyCode]) => {
                  const currency = CURRENCIES[currencyCode];
                  const converted = convertPrice(testPrice, country);
                  
                  return (
                    <tr key={country} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-4 font-mono font-semibold">{country}</td>
                      <td className="py-2 px-4">
                        <span className="font-semibold">{currency?.symbol}</span> {currencyCode}
                      </td>
                      <td className="py-2 px-4 text-gray-600 font-mono text-sm">
                        {currency?.rate.toFixed(4)}
                      </td>
                      <td className="py-2 px-4 text-right font-semibold text-purple-600">
                        {converted.formatted}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Showing 20 of {Object.keys(COUNTRY_TO_CURRENCY).length} supported countries
          </p>
        </div>
        
        {/* Feature Status */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mt-8">
          <h2 className="text-2xl font-semibold mb-4">Feature Status</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>60+ Countries Supported</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>40+ Currencies</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Auto Country Detection</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Manual Currency Override</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Localized Formatting</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Discount Calculations</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600">⚡</span>
                <span>VAT/GST Support (New!)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600">⚡</span>
                <span>Daily Rate Updates (New!)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
