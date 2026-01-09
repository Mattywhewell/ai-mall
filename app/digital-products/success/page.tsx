'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  const [loading, setLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [productTitle, setProductTitle] = useState('');

  useEffect(() => {
    if (sessionId) {
      // In production, fetch session details and get download link
      setTimeout(() => {
        setProductTitle('Your Digital Product');
        setDownloadUrl('/api/digital-products/download?session=' + sessionId);
        setLoading(false);
      }, 1000);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your download...</p>
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
        <h1 className="text-4xl font-bold mb-4">Purchase Successful!</h1>
        <p className="text-xl text-gray-600 mb-8">
          Your digital product is ready for download.
        </p>

        {/* Product Title */}
        <div className="bg-indigo-50 rounded-xl p-6 mb-8">
          <div className="text-sm text-indigo-600 mb-1">You purchased:</div>
          <div className="text-2xl font-bold text-indigo-900">{productTitle}</div>
        </div>

        {/* Download Button */}
        <a
          href={downloadUrl}
          download
          className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition shadow-lg mb-6"
        >
          📥 Download Now
        </a>

        {/* Additional Info */}
        <div className="text-sm text-gray-600 space-y-2 mb-8">
          <p>✓ Download link has been sent to your email</p>
          <p>✓ You can re-download anytime from your account</p>
          <p>✓ Lifetime access with no additional fees</p>
        </div>

        {/* Navigation Links */}
        <div className="flex justify-center gap-4 text-sm">
          <Link
            href="/digital-products"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Browse More Products
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Return to Aiverse
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
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
