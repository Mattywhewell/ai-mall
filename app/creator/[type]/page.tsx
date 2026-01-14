import Link from 'next/link';
import { ArrowLeft, Users, Sparkles, Heart, Star, Globe, Palette, Code, Camera, Building } from 'lucide-react';
import { notFound } from 'next/navigation';

const CREATOR_TYPE_DATA = {
  'artists': {
    name: 'Digital Artists',
    description: 'Visual creators bringing imagination to life through digital art, illustrations, and designs.',
    icon: Palette,
    color: 'from-purple-500 to-pink-500',
    features: ['Digital art', 'Illustrations', 'NFT collections', 'Brand collaborations'],
    longDescription: 'Join a vibrant community of digital artists creating stunning visual experiences. Whether you specialize in digital paintings, 3D modeling, or generative art, our platform provides the tools and audience you need to showcase your work and monetize your creativity.',
    communitySize: '2,500+ artists',
    opportunities: ['Art commissions', 'NFT marketplace', 'Brand partnerships', 'Gallery exhibitions']
  },
  'developers': {
    name: 'AI Developers',
    description: 'Technical innovators building the next generation of AI-powered tools and experiences.',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    features: ['AI tools', 'APIs', 'Integrations', 'Open source'],
    longDescription: 'Connect with fellow developers pushing the boundaries of AI technology. Share your open-source projects, collaborate on innovative solutions, and monetize your technical expertise through our developer marketplace.',
    communitySize: '1,800+ developers',
    opportunities: ['API development', 'Tool monetization', 'Consulting gigs', 'Open source funding']
  },
  'content-creators': {
    name: 'Content Creators',
    description: 'Storytellers and educators sharing knowledge about AI, technology, and creative processes.',
    icon: Camera,
    color: 'from-green-500 to-emerald-500',
    features: ['Tutorials', 'Courses', 'Blog posts', 'Videos'],
    longDescription: 'Share your expertise and passion for AI and technology with a global audience. Create educational content, tutorials, courses, and engage with a community that values knowledge sharing and continuous learning.',
    communitySize: '3,200+ creators',
    opportunities: ['Course creation', 'Sponsored content', 'Affiliate partnerships', 'Speaking engagements']
  },
  'entrepreneurs': {
    name: 'AI Entrepreneurs',
    description: 'Visionary business builders creating AI-native companies and marketplace solutions.',
    icon: Building,
    color: 'from-yellow-500 to-orange-500',
    features: ['AI startups', 'Marketplaces', 'Consulting', 'Innovation'],
    longDescription: 'Build and scale AI-native businesses with access to our entrepreneurial ecosystem. Connect with investors, partners, and fellow entrepreneurs while leveraging our platform\'s tools for rapid growth and market validation.',
    communitySize: '950+ entrepreneurs',
    opportunities: ['Funding opportunities', 'Strategic partnerships', 'Mentorship programs', 'Market expansion']
  }
};

interface CreatorTypePageProps {
  params: Promise<{
    type: string;
  }>;
}

export default async function CreatorTypePage({ params }: CreatorTypePageProps) {
  const { type } = await params;
  const creatorType = CREATOR_TYPE_DATA[type as keyof typeof CREATOR_TYPE_DATA];

  if (!creatorType) {
    notFound();
  }

  const IconComponent = creatorType.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <Link
            href="/creator"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8 transition-colors"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Creator Hub
          </Link>

          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r ${creatorType.color} mb-6`}>
              <IconComponent className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              {creatorType.name}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              {creatorType.longDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/creator/apply"
                className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
              >
                <Users className="mr-2 h-5 w-5" />
                Join {creatorType.name}
              </Link>
              <Link
                href="/city"
                className="inline-flex items-center px-8 py-4 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <Globe className="mr-2 h-5 w-5" />
                Explore Aiverse
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">{creatorType.communitySize}</div>
              <div className="text-gray-600">Active Community Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-gray-600">Platform Availability</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">Global</div>
              <div className="text-gray-600">Market Reach</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What You Can Do
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Leverage our platform's features to maximize your creative potential and business opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {creatorType.features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-4">
                  <Sparkles className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature}</h3>
                <p className="text-gray-600">Create and monetize your {feature.toLowerCase()} with our comprehensive toolkit.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Opportunities */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Opportunities & Benefits
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Unlock new revenue streams and growth opportunities in the AI-native economy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {creatorType.opportunities.map((opportunity, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0">
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{opportunity}</h3>
                  <p className="text-gray-600">Access specialized opportunities designed for {creatorType.name.toLowerCase()} to grow your career and business.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Join the {creatorType.name} Community?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Start your journey in the AI-native creator economy today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/creator/apply"
              className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg"
            >
              <Users className="mr-2 h-5 w-5" />
              Apply Now
            </Link>
            <Link
              href="/city"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-indigo-600 transition-colors"
            >
              <Globe className="mr-2 h-5 w-5" />
              Visit Aiverse
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function generateStaticParams() {
  return [
    { type: 'artists' },
    { type: 'developers' },
    { type: 'content-creators' },
    { type: 'entrepreneurs' }
  ];
}