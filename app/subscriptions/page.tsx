'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [mySubscriptions, setMySubscriptions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-subscriptions'>('browse');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'browse') {
        const response = await fetch('/api/subscriptions');
        const data = await response.json();
        setPlans(data.plans || []);
      } else {
        const userId = 'demo-user'; // Replace with actual user ID
        const response = await fetch(`/api/subscriptions?userId=${userId}`);
        const data = await response.json();
        setMySubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string, billingCycle: string) => {
    try {
      const userId = 'demo-user';
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          userId,
          billingCycle,
          shippingAddress: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
            country: 'US',
          },
        }),
      });

      if (response.ok) {
        alert('Subscription activated! 🎉');
        setActiveTab('my-subscriptions');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Failed to subscribe. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📦 Subscription Boxes
          </h1>
          <p className="text-lg text-gray-600">
            Get curated products delivered monthly from your favorite creators
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-6 py-3 font-semibold border-b-2 transition ${
              activeTab === 'browse'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Browse Plans
          </button>
          <button
            onClick={() => setActiveTab('my-subscriptions')}
            className={`px-6 py-3 font-semibold border-b-2 transition ${
              activeTab === 'my-subscriptions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            My Subscriptions
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {/* Browse Plans */}
            {activeTab === 'browse' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const savings = plan.price_annual 
                    ? Math.round(((plan.price_monthly * 12 - plan.price_annual) / (plan.price_monthly * 12)) * 100)
                    : 0;

                  return (
                    <div key={plan.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition">
                      {/* Image */}
                      <div className="relative h-48 bg-gradient-to-br from-purple-500 to-pink-500">
                        {plan.image_url && (
                          <Image
                            src={plan.image_url}
                            alt={plan.name}
                            fill
                            className="object-cover"
                          />
                        )}
                        {plan.spots_available && plan.subscribers_count >= plan.spots_available * 0.8 && (
                          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            🔥 Almost Full!
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        {/* Creator */}
                        <div className="flex items-center gap-3 mb-4">
                          {plan.creator?.logo_url && (
                            <div className="w-10 h-10 relative rounded-full overflow-hidden">
                              <Image
                                src={plan.creator.logo_url}
                                alt={plan.creator.brand_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <Link
                              href={`/storefront/${plan.creator?.slug}`}
                              className="font-semibold text-gray-900 hover:text-indigo-600"
                            >
                              {plan.creator?.brand_name}
                            </Link>
                            <p className="text-xs text-gray-500">
                              ⭐ {plan.creator?.rating?.toFixed(1)} • {plan.subscribers_count} subscribers
                            </p>
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {plan.name}
                        </h3>

                        {plan.tagline && (
                          <p className="text-sm text-gray-600 mb-4">
                            {plan.tagline}
                          </p>
                        )}

                        {/* Features */}
                        <div className="space-y-2 mb-6">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span>📦</span>
                            <span>{plan.products_per_box} products per box</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span>💎</span>
                            <span>${plan.estimated_value} value</span>
                          </div>
                          {plan.shipping_included && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <span>🚚</span>
                              <span>Free shipping</span>
                            </div>
                          )}
                          {plan.exclusive_products && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <span>✨</span>
                              <span>Exclusive products</span>
                            </div>
                          )}
                        </div>

                        {/* Pricing */}
                        <div className="border-t pt-4">
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-3xl font-bold text-gray-900">
                              ${plan.price_monthly}
                            </span>
                            <span className="text-gray-600">/month</span>
                          </div>

                          {plan.price_annual && savings > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
                              <p className="text-xs text-green-700 font-semibold">
                                💰 Save {savings}% with annual plan (${plan.price_annual}/year)
                              </p>
                            </div>
                          )}

                          <button
                            onClick={() => handleSubscribe(plan.id, 'monthly')}
                            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                          >
                            Subscribe Now
                          </button>

                          {plan.cancel_anytime && (
                            <p className="text-xs text-gray-500 text-center mt-2">
                              Cancel anytime
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* My Subscriptions */}
            {activeTab === 'my-subscriptions' && (
              <>
                {mySubscriptions.length > 0 ? (
                  <div className="space-y-6">
                    {mySubscriptions.map((subscription) => (
                      <div key={subscription.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              {subscription.plan?.creator?.logo_url && (
                                <div className="w-16 h-16 relative rounded-full overflow-hidden flex-shrink-0">
                                  <Image
                                    src={subscription.plan.creator.logo_url}
                                    alt={subscription.plan.creator.brand_name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                  {subscription.plan?.name}
                                </h3>
                                <p className="text-gray-600">
                                  by {subscription.plan?.creator?.brand_name}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    subscription.status === 'active'
                                      ? 'bg-green-100 text-green-700'
                                      : subscription.status === 'paused'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {subscription.status.toUpperCase()}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    {subscription.boxes_received} boxes received
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-2xl font-bold text-gray-900">
                                ${subscription.price_paid}
                              </p>
                              <p className="text-sm text-gray-600">
                                per {subscription.billing_cycle}
                              </p>
                              {subscription.next_billing_date && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Next: {new Date(subscription.next_billing_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Recent Boxes */}
                          {subscription.recent_boxes && subscription.recent_boxes.length > 0 && (
                            <div className="mt-6">
                              <h4 className="font-semibold text-gray-900 mb-3">Recent Boxes</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {subscription.recent_boxes.map((box: any) => (
                                  <div key={box.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-semibold text-gray-900">
                                        Box #{box.box_number}
                                      </span>
                                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        box.status === 'delivered'
                                          ? 'bg-green-100 text-green-700'
                                          : box.status === 'shipped'
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        {box.status}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">
                                      {box.month} {box.year}
                                    </p>
                                    {box.theme && (
                                      <p className="text-xs text-gray-500 italic">
                                        Theme: {box.theme}
                                      </p>
                                    )}
                                    {box.tracking_number && (
                                      <p className="text-xs text-indigo-600 mt-2">
                                        Track: {box.tracking_number}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="mt-6 flex gap-3">
                            {subscription.status === 'active' && (
                              <>
                                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                                  Update Preferences
                                </button>
                                <button className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition">
                                  Pause
                                </button>
                                <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition">
                                  Cancel
                                </button>
                              </>
                            )}
                            {subscription.status === 'paused' && (
                              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                                Resume Subscription
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      No Active Subscriptions
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Subscribe to get curated boxes delivered monthly!
                    </p>
                    <button
                      onClick={() => setActiveTab('browse')}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                    >
                      Browse Plans
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Empty State for Browse */}
        {activeTab === 'browse' && !loading && plans.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🎁</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Coming Soon!
            </h3>
            <p className="text-gray-600">
              Creators are preparing amazing subscription boxes for you
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
