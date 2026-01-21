'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  tagline: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: any;
  limits: any;
  is_featured: boolean;
}

function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
     
  }, []);

  async function fetchPlans() {
      try {
        const res = await fetch('/api/subscriptions/plans');
        const data = await res.json();
        setPlans(data.plans || []);
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      } finally {
        setLoading(false);
      }
    }

    async function handleSubscribe(planId: string) {
      if (subscribing) return;
      const email = prompt('Enter your email:');
      if (!email) return;
      setSubscribing(planId);
      try {
        const res = await fetch('/api/subscriptions/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan_id: planId,
            user_email: email,
            billing_cycle: billingCycle,
          }),
        });
        const data = await res.json();
        if (data.url) {
          if (typeof window !== 'undefined') {
            window.location.href = data.url;
          }
        } else {
          alert('Subscription failed: ' + data.error);
        }
      } catch (error) {
        console.error('Subscription error:', error);
        alert('Failed to create subscription');
      } finally {
        setSubscribing(null);
      }
    }

    const getPrice = (plan: Plan) => {
      return billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    };

    const getSavings = (plan: Plan) => {
      if (!plan.price_yearly || !plan.price_monthly) return 0;
      const yearlyTotal = plan.price_monthly * 12;
      const savings = yearlyTotal - plan.price_yearly;
      return Math.round((savings / yearlyTotal) * 100);
    };

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-16 text-center">
            <h1 className="text-5xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-xl text-indigo-100 mb-8">Scale Alverse with powerful automation and insights</p>
            {/* Billing Toggle */}
            <div className="inline-flex bg-white/10 backdrop-blur-sm rounded-full p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full transition ${billingCycle === 'monthly' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white hover:text-indigo-100'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full transition ${billingCycle === 'yearly' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white hover:text-indigo-100'}`}
              >
                Yearly <span className="text-sm">(Save up to 17%)</span>
              </button>
            </div>
          </div>
        </div>
        {/* Plans Grid */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${plan.is_featured ? 'ring-4 ring-indigo-600 scale-105' : ''}`}
              >
                {plan.is_featured && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 text-sm font-semibold">POPULAR</div>
                )}
                <div className="p-8">
                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.tagline}</p>
                  {/* Price */}
                  <div className="mb-6">
                    {getPrice(plan) === 0 ? (
                      <div className="text-5xl font-bold">Free</div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold">${getPrice(plan)}</span>
                          <span className="text-gray-500">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                        </div>
                        {billingCycle === 'yearly' && getSavings(plan) > 0 && (
                          <div className="text-sm text-green-600 mt-2">Save {getSavings(plan)}% with annual billing</div>
                        )}
                      </>
                    )}
                  </div>
                  {/* CTA Button */}
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing === plan.id}
                    className={`w-full py-3 rounded-lg font-semibold transition ${plan.is_featured ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} disabled:opacity-50`}
                  >
                    {subscribing === plan.id ? 'Processing...' : 'Get Started'}
                  </button>
                  {/* Features */}
                  <div className="mt-8 space-y-3">
                    {plan.features.ai_storefronts !== undefined && (
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">
                          {plan.features.ai_storefronts === -1
                            ? 'Unlimited AI Storefronts'
                            : plan.features.ai_storefronts === 0
                            ? 'No AI Storefronts'
                            : `${plan.features.ai_storefronts} AI Storefront${plan.features.ai_storefronts > 1 ? 's' : ''}`}
                        </span>
                      </div>
                    )}
                    {plan.features.products !== undefined && (
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">
                          {plan.features.products === -1
                            ? 'Unlimited Products'
                            : `Up to ${plan.features.products} products`}
                        </span>
                      </div>
                    )}
                    {plan.features.analytics && (
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">
                          {plan.features.analytics === 'enterprise'
                            ? 'Enterprise Analytics'
                            : plan.features.analytics === 'pro'
                            ? 'Pro Analytics'
                            : plan.features.analytics === 'advanced'
                            ? 'Advanced Analytics'
                            : 'Basic Analytics'}
                        </span>
                      </div>
                    )}
                    {plan.features.ai_credits && (
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{plan.features.ai_credits.toLocaleString()} AI credits/month</span>
                      </div>
                    )}
                    {plan.features.automation && (
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">
                          {plan.features.automation === 'full'
                            ? 'Full Automation Suite'
                            : plan.features.automation === 'advanced'
                            ? 'Advanced Automation'
                            : 'Basic Automation'}
                        </span>
                      </div>
                    )}
                    {plan.features.forecasting && (
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">Demand Forecasting</span>
                      </div>
                    )}
                    {plan.features.dynamic_pricing && (
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">Dynamic Pricing</span>
                      </div>
                    )}
                    {plan.features.white_label && (
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">White Label Ready</span>
                      </div>
                    )}
                    {plan.features.api_access && (
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">API Access</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* FAQ or Additional Info */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-4">All plans include 14-day free trial. No credit card required.</p>
            <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">← Back to Alverse</Link>
          </div>
        </div>
      </div>
    );
  }

  export default PricingPage;
