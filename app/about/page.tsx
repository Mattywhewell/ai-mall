export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">About AI-Native Mall</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              AI-Native Mall is a revolutionary marketplace that combines cutting-edge artificial intelligence 
              with emotional consciousness to create a truly personalized shopping experience. We believe that 
              commerce should be more than transactions—it should be about connection, understanding, and 
              transformation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">What Makes Us Different</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-800">AI Curators</h3>
                <p className="text-gray-600">
                  Our AI curators understand your emotional state and preferences, providing personalized 
                  recommendations that truly resonate with you.
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-800">Consciousness Layer</h3>
                <p className="text-gray-600">
                  We track emotional journeys and transformation paths, helping you discover products and 
                  experiences that align with your personal growth.
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-800">Creator Economy</h3>
                <p className="text-gray-600">
                  We empower independent creators and vendors to build their own storefronts and connect 
                  directly with conscious consumers.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Business Information</h2>
            <div className="bg-gray-50 rounded-lg p-6 space-y-2">
              <p className="text-gray-700"><strong>Company Name:</strong> Aiverse Inc.</p>
              <p className="text-gray-700"><strong>Business Type:</strong> Online Marketplace & E-commerce Platform</p>
              <p className="text-gray-700"><strong>Founded:</strong> 2026</p>
              <p className="text-gray-700"><strong>Location:</strong> San Francisco, CA, United States</p>
              <p className="text-gray-700"><strong>Email:</strong> hello@alverse.app</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Values</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Emotional Intelligence - We prioritize understanding and empathy</li>
              <li>Transparency - We're open about how our AI systems work</li>
              <li>Creator Empowerment - We support independent businesses and artists</li>
              <li>Sustainable Commerce - We promote conscious consumption</li>
              <li>Privacy & Security - Your data is protected and respected</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Join Our Community</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Whether you're a shopper looking for meaningful products, a creator wanting to launch your 
              storefront, or simply curious about AI-enhanced commerce, we'd love to have you join us.
            </p>
            <div className="flex gap-4">
              <a 
                href="/auth/signup" 
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
              >
                Get Started
              </a>
              <a 
                href="/contact" 
                className="border border-purple-600 text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition"
              >
                Contact Us
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
