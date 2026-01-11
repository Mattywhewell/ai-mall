import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Aiverse
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-4">
              The Living AI City
            </p>
            <p className="text-lg text-gray-500 mb-8 max-w-3xl mx-auto">
              Where consciousness, commerce, and creativity converge. Step into a world that grows with you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/city"
                className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Explore the City
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/creator/apply"
                className="inline-flex items-center px-8 py-4 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Become a Creator
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Districts Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Explore the Districts
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each district represents a unique aspect of our AI-native civilization,
              designed to nurture different facets of human creativity and consciousness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">🏪</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Commerce District
              </h3>
              <p className="text-gray-600 mb-4">
                The beating heart of AI-native products, services, and experiences.
              </p>
              <ul className="space-y-1">
                <li className="text-sm text-gray-500 flex items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                  AI-powered products
                </li>
                <li className="text-sm text-gray-500 flex items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                  Dynamic pricing
                </li>
                <li className="text-sm text-gray-500 flex items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                  Emotional commerce
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">✨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Supplier District
              </h3>
              <p className="text-gray-600 mb-4">
                Where suppliers manage their storefronts and connect with the marketplace.
              </p>
              <ul className="space-y-1">
                <li className="text-sm text-gray-500 flex items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                  Supplier dashboard
                </li>
                <li className="text-sm text-gray-500 flex items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                  Product management
                </li>
                <li className="text-sm text-gray-500 flex items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                  Analytics & insights
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Automation District
              </h3>
              <p className="text-gray-600 mb-4">
                Cutting-edge AI tools and automated systems for creators and businesses.
              </p>
              <ul className="space-y-1">
                <li className="text-sm text-gray-500 flex items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                  AI automation tools
                </li>
                <li className="text-sm text-gray-500 flex items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                  Workflow optimization
                </li>
                <li className="text-sm text-gray-500 flex items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                  Smart integrations
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">⭐</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Lore District
              </h3>
              <p className="text-gray-600 mb-4">
                The storytelling and cultural heart of Aiverse, where narratives come alive.
              </p>
              <ul className="space-y-1">
                <li className="text-sm text-gray-500 flex items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                  Interactive stories
                </li>
                <li className="text-sm text-gray-500 flex items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                  Cultural experiences
                </li>
                <li className="text-sm text-gray-500 flex items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                  Community narratives
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/districts"
              className="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              Discover All Districts
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}