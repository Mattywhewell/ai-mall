/**
 * Cookie Policy Page
 */

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Cookie Policy | AI Mall',
  description: 'Learn about how we use cookies and tracking technologies',
};

export default function CookiesPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-gray-600">
            Last updated: January 6, 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Are Cookies?</h2>
            <p className="text-gray-700">
              Cookies are small text files that are placed on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences, 
              analyzing how you use our site, and personalizing content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Types of Cookies We Use</h2>
            
            <div className="space-y-4">
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Essential Cookies</h3>
                <p className="text-gray-700">
                  These cookies are necessary for the website to function properly. They enable core 
                  functionality such as security, network management, and accessibility.
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-2 ml-4">
                  <li>Authentication and session management</li>
                  <li>Security features</li>
                  <li>Shopping cart functionality</li>
                </ul>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Cookies</h3>
                <p className="text-gray-700">
                  These cookies collect information about how visitors use our website, such as which 
                  pages are visited most often.
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-2 ml-4">
                  <li>Page load performance</li>
                  <li>Error tracking</li>
                  <li>User behavior analytics</li>
                </ul>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Functionality Cookies</h3>
                <p className="text-gray-700">
                  These cookies allow the website to remember choices you make and provide enhanced features.
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-2 ml-4">
                  <li>Language preferences</li>
                  <li>Currency selection</li>
                  <li>User preferences and settings</li>
                </ul>
              </div>

              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Targeting/Advertising Cookies</h3>
                <p className="text-gray-700">
                  These cookies are used to deliver advertisements that are relevant to you and your interests.
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-2 ml-4">
                  <li>Personalized recommendations</li>
                  <li>Marketing campaign tracking</li>
                  <li>Retargeting advertisements</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Cookies</h2>
            <p className="text-gray-700 mb-3">
              We use services from trusted third parties that may also set cookies:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Google Analytics:</strong> For website analytics and performance monitoring</li>
              <li><strong>Stripe:</strong> For secure payment processing</li>
              <li><strong>Supabase:</strong> For authentication and database services</li>
              <li><strong>Vercel:</strong> For hosting and performance optimization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Managing Your Cookies</h2>
            <p className="text-gray-700 mb-3">
              You have several options for managing cookies:
            </p>
            
            <div className="bg-purple-50 rounded-lg p-6 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Browser Settings</h3>
              <p className="text-gray-700">
                Most browsers allow you to control cookies through their settings. You can typically:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 ml-4">
                <li>View and delete cookies</li>
                <li>Block all cookies</li>
                <li>Block third-party cookies</li>
                <li>Clear cookies when you close the browser</li>
              </ul>
            </div>

            <p className="text-gray-700">
              <strong>Note:</strong> Disabling cookies may affect the functionality of our website 
              and limit your ability to use certain features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookie Retention</h2>
            <p className="text-gray-700">
              Different cookies have different retention periods:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
              <li><strong>Persistent cookies:</strong> Remain on your device for a set period (typically 30 days to 2 years)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Consent</h2>
            <p className="text-gray-700">
              By using our website, you consent to our use of cookies as described in this policy. 
              When you first visit our site, you'll see a cookie banner allowing you to accept or 
              customize your cookie preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Updates to This Policy</h2>
            <p className="text-gray-700">
              We may update this Cookie Policy from time to time. Any changes will be posted on this 
              page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700">
              If you have questions about our use of cookies, please contact us:
            </p>
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@ai-mall.com<br />
                <strong>Address:</strong> AI Mall Inc., San Francisco, CA
              </p>
            </div>
          </section>

          <section className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Policies</h3>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/privacy" 
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                Privacy Policy →
              </Link>
              <Link 
                href="/terms" 
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                Terms & Conditions →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
