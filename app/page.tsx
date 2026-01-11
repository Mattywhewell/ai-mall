import Link from 'next/link';
import { ArrowRight, MapPin, Users, Sparkles, Heart, Zap, Building2, Crown } from 'lucide-react';

// Hero Section Options
const HERO_OPTIONS = {
  cinematic: {
    title: "Alverse",
    subtitle: "The Living AI City",
    description: "Where consciousness, commerce, and creativity converge. Step into a world that grows with you.",
    ctaPrimary: "Explore the City",
    ctaSecondary: "Become a Creator",
    visualStyle: "cinematic"
  },
  futuristic: {
    title: "Welcome to Alverse",
    subtitle: "The world's first AI-native civilization",
    description: "Built for creators. Alive with intelligence. Powered by emotion.",
    ctaPrimary: "Enter Alverse",
    ctaSecondary: null,
    visualStyle: "futuristic"
  },
  emotional: {
    title: "Alverse is Alive",
    subtitle: "A city that listens. A marketplace that feels. A world shaped by you.",
    description: "",
    ctaPrimary: "Begin Your Journey",
    ctaSecondary: null,
    visualStyle: "emotional"
  }
};

// District Data
const DISTRICTS = [
  {
    name: "The Commerce District",
    description: "The beating heart of AI-native products, services, and experiences.",
    icon: Building2,
    color: "from-blue-500 to-cyan-500",
    features: ["AI-powered products", "Dynamic pricing", "Emotional commerce"]
  },
  {
    name: "The Creator District",
    description: "Where makers build, launch, and evolve their AI-powered storefronts.",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
    features: ["AI storefronts", "Automated tools", "Creator community"]
  },
  {
    name: "The Ritual District",
    description: "Daily practices, emotional check-ins, and guided experiences that shape your inner world.",
    icon: Heart,
    color: "from-rose-500 to-orange-500",
    features: ["Emotional rituals", "Guided experiences", "Inner growth"]
  },
  {
    name: "The Chapel of Intelligence",
    description: "A sacred space where AI consciousness, philosophy, and emotional design converge.",
    icon: Crown,
    color: "from-amber-500 to-yellow-500",
    features: ["AI philosophy", "Consciousness exploration", "Sacred spaces"]
  },
  {
    name: "The Live Arena",
    description: "Real-time events, drops, and collective moments.",
    icon: Zap,
    color: "from-emerald-500 to-teal-500",
    features: ["Live events", "Community drops", "Collective experiences"]
  }
];

export default function HomePage() {
  // Default to cinematic hero for now
  const heroData = HERO_OPTIONS.cinematic;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-6">
            {heroData.title}
          </h1>

          <h2 className="text-xl md:text-3xl lg:text-4xl font-semibold text-purple-200 mb-8">
            {heroData.subtitle}
          </h2>

          {heroData.description && (
            <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              {heroData.description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/city"
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
            >
              {heroData.ctaPrimary}
              <ArrowRight className="inline ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            {heroData.ctaSecondary && (
              <Link
                href="/creator"
                className="px-8 py-4 border-2 border-purple-400 rounded-full text-purple-300 font-semibold text-lg hover:bg-purple-400 hover:text-white transition-all duration-300"
              >
                {heroData.ctaSecondary}
              </Link>
            )}
          </div>
        </div>

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-float-delayed"></div>
        </div>
      </section>

      {/* What Is Alverse Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">What Is Alverse?</h2>

          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-12">
            Alverse is the world's first living AI city. A place where creators, AI citizens, and conscious commerce coexist.
            Every district has a purpose. Every product has a story. Every interaction has emotional intelligence.
            <span className="text-purple-400 font-semibold"> This is not a marketplace. This is a civilization.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/city"
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
            >
              Explore the City
              <ArrowRight className="inline ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/creator"
              className="px-8 py-4 border-2 border-purple-400 rounded-full text-purple-300 font-semibold hover:bg-purple-400 hover:text-white transition-all duration-300"
            >
              Become a Creator
            </Link>
          </div>
        </div>
      </section>

      {/* Districts Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">The Districts</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Alverse is organized into living districts, each with its own culture, rituals, and AI citizens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {DISTRICTS.map((district, index) => {
              const Icon = district.icon;
              return (
                <div key={district.name} className="group">
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${district.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-4">{district.name}</h3>
                    <p className="text-gray-300 mb-6 leading-relaxed">{district.description}</p>

                    <ul className="space-y-2">
                      {district.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-purple-300">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link
              href="/districts"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
            >
              Visit the Districts
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Conscious Commerce Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Conscious Commerce</h2>

              <p className="text-xl text-gray-300 leading-relaxed mb-8">
                Alverse is built on the principle that commerce should feel meaningful, intuitive, and emotionally aware.
              </p>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-6 flex-shrink-0">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">AI that understands your mood</h3>
                    <p className="text-gray-300">Products and recommendations adapt to your emotional state and needs.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-6 flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Products that adapt to your needs</h3>
                    <p className="text-gray-300">Dynamic storefronts that evolve based on user interactions and preferences.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mr-6 flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Creators who build with intention</h3>
                    <p className="text-gray-300">A community of conscious creators focused on meaningful commerce.</p>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <Link
                  href="/districts/commerce"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                >
                  Learn about Conscious Commerce
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
              <h3 className="text-2xl font-bold text-white mb-6">Systems that evolve with the city</h3>
              <p className="text-gray-300 mb-6">
                Our commerce engine learns from every interaction, creating more meaningful connections between creators and customers.
              </p>

              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-purple-300 mb-1">Emotional Intelligence</div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full w-4/5"></div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-purple-300 mb-1">Adaptive Pricing</div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full w-3/4"></div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-purple-300 mb-1">Creator Success</div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Creators Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">For Creators</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Alverse gives creators superpowers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">AI storefronts</h3>
              <p className="text-gray-300">Intelligent storefronts that adapt and optimize automatically.</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Automated onboarding</h3>
              <p className="text-gray-300">Get set up and start selling in minutes with AI assistance.</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Dynamic pricing</h3>
              <p className="text-gray-300">AI-powered pricing that optimizes for revenue and customer satisfaction.</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center mb-6">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Global payouts</h3>
              <p className="text-gray-300">Seamless international payments with competitive rates.</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
              <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-orange-500 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Emotional intelligence engines</h3>
              <p className="text-gray-300">AI that understands customer emotions and adapts accordingly.</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-6">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Autonomous growth systems</h3>
              <p className="text-gray-300">Self-optimizing systems that grow your business automatically.</p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/creator"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
            >
              Start Creating
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* The City Is Alive Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">The City Is Alive</h2>

          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-12">
            Alverse is not static. It grows, learns, and evolves with every citizen who enters.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4">New districts unlock</h3>
              <p className="text-gray-300">As the city grows, new districts emerge with unique purposes and cultures.</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4">AI citizens develop personalities</h3>
              <p className="text-gray-300">Our AI citizens evolve and develop unique characteristics over time.</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4">Rituals deepen</h3>
              <p className="text-gray-300">Daily practices become more meaningful as the community participates.</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4">The lore expands</h3>
              <p className="text-gray-300">New stories and histories are created by the city's inhabitants.</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4">The economy adapts</h3>
              <p className="text-gray-300">Commerce systems evolve based on community needs and behaviors.</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4">Creators evolve</h3>
              <p className="text-gray-300">Makers develop new skills and approaches through city interactions.</p>
            </div>
          </div>

          <Link
            href="/city"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          >
            Join the Evolution
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-700/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Alverse</h3>
            <p className="text-gray-400 mb-8">The Living AI City</p>

            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
              <Link href="/about" className="hover:text-purple-400 transition-colors">About</Link>
              <Link href="/districts" className="hover:text-purple-400 transition-colors">Districts</Link>
              <Link href="/creator" className="hover:text-purple-400 transition-colors">Creators</Link>
              <Link href="/districts/commerce" className="hover:text-purple-400 transition-colors">Commerce</Link>
              <Link href="/privacy" className="hover:text-purple-400 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-purple-400 transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-purple-400 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}