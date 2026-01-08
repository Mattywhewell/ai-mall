'use client';

import { useState } from 'react';
import { Gift, CreditCard, Heart, Calendar, Package } from 'lucide-react';
import Link from 'next/link';

export default function GiftsPage() {
  const [activeTab, setActiveTab] = useState<'cards' | 'registries'>('cards');

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Gift Center</h1>
          <p className="text-gray-600 text-lg">Perfect gifts for every occasion</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-full p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                activeTab === 'cards'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CreditCard className="w-5 h-5 inline mr-2" />
              Gift Cards
            </button>
            <button
              onClick={() => setActiveTab('registries')}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                activeTab === 'registries'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Heart className="w-5 h-5 inline mr-2" />
              Gift Registries
            </button>
          </div>
        </div>

        {activeTab === 'cards' && <GiftCardsSection />}
        {activeTab === 'registries' && <GiftRegistriesSection />}
      </div>
    </div>
  );
}

function GiftCardsSection() {
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const amounts = [25, 50, 100, 200];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Gift Card Designer */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-6">Design Your Gift Card</h2>
        
        {/* Gift Card Preview */}
        <div className="relative aspect-[1.6/1] bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800 rounded-xl p-6 mb-6 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
          </div>
          <div className="relative h-full flex flex-col justify-between">
            <div>
              <Gift className="w-12 h-12 text-white mb-2" />
              <h3 className="text-white text-2xl font-bold">Aiverse Gift Card</h3>
            </div>
            <div className="text-right">
              <div className="text-white/80 text-sm mb-1">Value</div>
              <div className="text-white text-4xl font-bold">${customAmount || selectedAmount}</div>
            </div>
          </div>
        </div>

        {/* Amount Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Select Amount</label>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {amounts.map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount('');
                }}
                className={`py-3 rounded-lg font-medium transition-all ${
                  selectedAmount === amount && !customAmount
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                ${amount}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="Or enter custom amount"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Recipient Info */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Name</label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Email</label>
            <input
              type="email"
              placeholder="john@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Personal Message</label>
            <textarea
              rows={3}
              placeholder="Add a personal message..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date (Optional)</label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition-all">
          Purchase Gift Card
        </button>
      </div>

      {/* Gift Card Info */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Why Choose Our Gift Cards?</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">No Expiration</h4>
                <p className="text-sm text-gray-600">Gift cards never expire and can be used anytime</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Use on Anything</h4>
                <p className="text-sm text-gray-600">Valid for all products and districts in Aiverse</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Instant Delivery</h4>
                <p className="text-sm text-gray-600">Delivered via email instantly or on your chosen date</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-3">Check Gift Card Balance</h3>
          <p className="text-purple-100 mb-4 text-sm">Enter your gift card code to check the balance</p>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter gift card code"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900"
            />
            <button className="px-6 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition-colors">
              Check
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GiftRegistriesSection() {
  const eventTypes = [
    { id: 'wedding', name: 'Wedding', icon: '💍' },
    { id: 'birthday', name: 'Birthday', icon: '🎂' },
    { id: 'baby', name: 'Baby Shower', icon: '👶' },
    { id: 'holiday', name: 'Holiday', icon: '🎄' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Create Registry */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-6">Create Gift Registry</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Registry Title</label>
            <input
              type="text"
              placeholder="Sarah & John's Wedding"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
            <div className="grid grid-cols-2 gap-3">
              {eventTypes.map((type) => (
                <button
                  key={type.id}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="font-medium">{type.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={4}
              placeholder="Tell your story and what you're celebrating..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            ></textarea>
          </div>

          <div className="flex items-center">
            <input type="checkbox" id="public" className="w-4 h-4 text-purple-600 rounded" />
            <label htmlFor="public" className="ml-2 text-sm text-gray-700">
              Make this registry public (searchable by anyone)
            </label>
          </div>

          <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition-all">
            Create Registry
          </button>
        </div>
      </div>

      {/* Find Registry */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Find a Registry</h3>
          <p className="text-gray-600 mb-4">Search for a registry by name or registry ID</p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter name or registry ID"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors">
              Search Registries
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-3">Popular Registries</h3>
          <div className="space-y-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Emily & Michael</h4>
                  <p className="text-sm text-pink-100">Wedding • June 15, 2026</p>
                </div>
                <div className="text-2xl">💍</div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Baby Thompson</h4>
                  <p className="text-sm text-pink-100">Baby Shower • March 20, 2026</p>
                </div>
                <div className="text-2xl">👶</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-3">How Gift Registries Work</h3>
          <ol className="space-y-3">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
              <div className="text-sm text-gray-700">Create your registry and add products you love</div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
              <div className="text-sm text-gray-700">Share your unique registry link with friends and family</div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
              <div className="text-sm text-gray-700">Guests purchase items and they're marked as fulfilled</div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
              <div className="text-sm text-gray-700">Receive gifts and track what's been purchased</div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
