'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  useEffect(() => {
    if (sessionId) {
      // In production, fetch session details
      setTimeout(() => {
        setSubscriptionData({
          plan: 'Pro Plan',
          billing: 'Monthly',
          trial_ends: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        });
        setLoading(false);
      }, 1000);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-12 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="text-4xl font-bold mb-4">Welcome to {subscriptionData?.plan}!</h1>
        <p className="text-xl text-gray-600 mb-8">
          Your subscription has been activated successfully.
        </p>

        {/* Subscription Details */}
        <div className="bg-indigo-50 rounded-xl p-6 mb-8 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-indigo-600 mb-1">Plan</div>
              <div className="font-semibold">{subscriptionData?.plan}</div>
            </div>
            <div>
              <div className="text-sm text-indigo-600 mb-1">Billing</div>
              <div className="font-semibold">{subscriptionData?.billing}</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-indigo-600 mb-1">Trial Period</div>
              <div className="font-semibold">14 days free (ends {subscriptionData?.trial_ends})</div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold mb-4">What's Next?</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-green-600 text-xl">✓</span>
              <span className="text-sm text-gray-700">Access all premium features immediately</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-600 text-xl">✓</span>
              <span className="text-sm text-gray-700">No charges until your trial ends</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-600 text-xl">✓</span>
              <span className="text-sm text-gray-700">Cancel anytime before trial ends</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/admin/dashboard"
            className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-lg"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="bg-gray-100 text-gray-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-200 transition"
          >
            Explore Aiverse
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
