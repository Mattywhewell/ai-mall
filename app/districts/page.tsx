import Link from 'next/link';
import { ArrowRight, Building2, Sparkles, Heart, Users, Zap, Globe, Star } from 'lucide-react';

const DISTRICTS = [
  {
    id: 'commerce',
    name: 'Commerce District',
    description: 'The beating heart of AI-native products, services, and experiences.',
    icon: Building2,
    color: 'from-blue-500 to-cyan-500',
    features: ['AI-powered products', 'Dynamic pricing', 'Emotional commerce'],
    path: '/districts/commerce'
  },
  {
    id: 'supplier',
    name: 'Supplier District',
    description: 'Where suppliers manage their storefronts and connect with the marketplace.',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    features: ['Supplier dashboard', 'Product management', 'Analytics & insights'],
    path: '/districts/supplier'
  },
  {
    id: 'automation',
    name: 'Automation District',
    description: 'Cutting-edge AI tools and automated systems for creators and businesses.',
    icon: Zap,
    color: 'from-yellow-500 to-orange-500',
    features: ['AI automation tools', 'Workflow optimization', 'Smart integrations'],
    path: '/districts/automation'
  },
  {
    id: 'lore',
    name: 'Lore District',
    description: 'The storytelling and cultural heart of Aiverse, where narratives come alive.',
    icon: Star,
    color: 'from-indigo-500 to-purple-500',
    features: ['Interactive stories', 'Cultural experiences', 'Community narratives'],
    path: '/districts/lore'
  }
];

export default function DistrictsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Explore the Districts
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-4">
              Discover the unique neighborhoods of Aiverse
            </p>
            <p className="text-lg text-gray-500 mb-8 max-w-3xl mx-auto">
              Each district represents a different aspect of our AI-native civilization,
              designed to nurture different facets of human creativity and consciousness.
            </p>
          </div>
        </div>
      </section>

      {/* Districts Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {DISTRICTS.map((district) => {
              const IconComponent = district.icon;
              return (
                <Link
                  key={district.id}
                  href={district.path}
                  className="group bg-gradient-to-br from-white to-gray-50 p-8 rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${district.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                    {district.name}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {district.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {district.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-500 flex items-center">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center text-indigo-600 font-medium group-hover:text-indigo-700">
                    Enter District
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Additional Actions */}
          <div className="text-center mt-16">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/city"
                className="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Globe className="mr-2 h-5 w-5" />
                View City Overview
              </Link>
              <Link
                href="/creator/apply"
                className="inline-flex items-center px-6 py-3 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <Users className="mr-2 h-5 w-5" />
                Become a Creator
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}