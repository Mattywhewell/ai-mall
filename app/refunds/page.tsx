/**
 * Refund Policy Page
 */

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Refund Policy | Aiverse',
  description: 'Learn about our refund and return policies',
};

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link 
          href="/"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Refund Policy</h1>
          <p className="text-gray-600">
            Last updated: January 6, 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-700">
              At Aiverse, we want you to be completely satisfied with your purchase. This Refund Policy 
              outlines the conditions under which refunds are available for products and services purchased 
              through our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Digital Products</h2>
            <p className="text-gray-700 mb-3">
              Digital products (AI models, datasets, digital content) may be eligible for refunds under 
              the following conditions:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Request made within 7 days of purchase</li>
              <li>Product is defective or not as described</li>
              <li>Product has not been downloaded or accessed extensively</li>
              <li>Technical issues prevent product use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Physical Products</h2>
            <p className="text-gray-700 mb-3">
              Physical products sold through Aiverse vendors are eligible for refunds:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Request made within 30 days of delivery</li>
              <li>Product is unopened and in original condition</li>
              <li>Product is defective or damaged upon receipt</li>
              <li>Wrong item was shipped</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Subscription Services</h2>
            <p className="text-gray-700 mb-3">
              Subscription refunds are handled as follows:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Pro-rated refunds available within first 30 days</li>
              <li>Cancel anytime to avoid future charges</li>
              <li>No refunds for partial months after 30-day period</li>
              <li>Annual subscriptions: pro-rated refund within 60 days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Request a Refund</h2>
            <p className="text-gray-700 mb-3">
              To request a refund:
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
              <li>Contact the vendor directly through their storefront</li>
              <li>For platform issues, contact support@alverse.app</li>
              <li>Include order number and reason for refund</li>
              <li>Wait for approval (typically 2-5 business days)</li>
              <li>Refund will be processed to original payment method</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Processing Time</h2>
            <p className="text-gray-700">
              Once approved, refunds are typically processed within 5-10 business days. The time it takes 
              for the refund to appear in your account depends on your payment provider.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Non-Refundable Items</h2>
            <p className="text-gray-700 mb-3">
              The following items are not eligible for refunds:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Gift cards and credits</li>
              <li>Customized or personalized products</li>
              <li>Downloaded software after 7 days</li>
              <li>Services already rendered</li>
              <li>Products marked as final sale</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700">
              If you have questions about our refund policy, please contact us:
            </p>
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> refunds@alverse.app<br />
                <strong>Support:</strong> support@alverse.app<br />
                <strong>Hours:</strong> Monday-Friday, 9am-5pm PST
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
