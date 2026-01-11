import Link from 'next/link';
import { ArrowRight, Users, Sparkles, Heart, Star, Globe, Palette, Code, Camera } from 'lucide-react';

const CREATOR_TYPES = [
  {
    id: 'artists',
    name: 'Digital Artists',
    description: 'Visual creators bringing imagination to life through digital art, illustrations, and designs.',
    icon: Palette,
    color: 'from-purple-500 to-pink-500',
    features: ['Digital art', 'Illustrations', 'NFT collections', 'Brand collaborations'],
    path: '/creator/artists'
  },
  {
    id: 'developers',
    name: 'AI Developers',
    description: 'Technical innovators building the next generation of AI-powered tools and experiences.',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    features: ['AI tools', 'APIs', 'Integrations', 'Open source'],
    path: '/creator/developers'
  },
  {
    id: 'content-creators',
    name: 'Content Creators',
    description: 'Storytellers and educators sharing knowledge about AI, technology, and creative processes.',
    icon: Camera,
    color: 'from-green-500 to-emerald-500',
    features: ['Tutorials', 'Courses', 'Blog posts', 'Videos'],
    path: '/creator/content-creators'
  },
  {
    id: 'entrepreneurs',
    name: 'AI Entrepreneurs',
    description: 'Visionary business builders creating AI-native companies and marketplace solutions.',
    icon: Sparkles,
    color: 'from-yellow-500 to-orange-500',
    features: ['AI startups', 'Marketplaces', 'Consulting', 'Innovation'],
    path: '/creator/entrepreneurs'
  }
];

export default function CreatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Join the Creator Economy
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-4">
              Become part of Aiverse's thriving community of creators
            </p>
            <p className="text-lg text-gray-500 mb-8 max-w-3xl mx-auto">
              Whether you're an artist, developer, content creator, or entrepreneur,
              Aiverse provides the tools, platform, and community to turn your creative vision into reality.
            </p>
          </div>
        </div>
      </section>

      {/* Creator Types Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Explore Creator Communities
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover your creative tribe and connect with like-minded creators in specialized communities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {CREATOR_TYPES.map((creatorType) => {
              const IconComponent = creatorType.icon;
              return (
                <Link
                  key={creatorType.id}
                  href={creatorType.path}
                  className="group bg-gradient-to-br from-white to-gray-50 p-8 rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${creatorType.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                    {creatorType.name}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {creatorType.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {creatorType.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-500 flex items-center">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center text-indigo-600 font-medium group-hover:text-indigo-700">
                    Explore Community
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of creators who are already building the future of AI-native creativity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/creator/apply"
              className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg"
            >
              <Users className="mr-2 h-5 w-5" />
              Apply to Join
            </Link>
            <Link
              href="/city"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-indigo-600 transition-colors"
            >
              <Globe className="mr-2 h-5 w-5" />
              Explore Aiverse
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Create in Aiverse?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Aiverse isn't just a platform—it's a creative ecosystem designed for the AI-native future.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Community Support</h3>
              <p className="text-gray-600">
                Connect with fellow creators, share knowledge, and build lasting relationships in our supportive community.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Tools</h3>
              <p className="text-gray-600">
                Access cutting-edge AI tools and platforms designed specifically for creative professionals.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Global Reach</h3>
              <p className="text-gray-600">
                Showcase your work to a global audience and monetize your creativity on an international scale.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}