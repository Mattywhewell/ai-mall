'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BecomeCreatorPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    user_id: '', // This would come from auth context
    brand_name: '',
    brand_story: '',
    category: 'craft',
    portfolio_urls: [''],
    social_links: {
      instagram: '',
      twitter: '',
      website: ''
    },
    experience_level: 'intermediate',
    requested_hall: '',
    requested_street: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Filter out empty portfolio URLs
      const cleanedData = {
        ...formData,
        portfolio_urls: formData.portfolio_urls.filter(url => url.trim() !== '')
      };

      const response = await fetch('/api/creator/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Application failed');
      }

      // Success! Redirect to application success page
      router.push(`/creator/application-success?id=${result.application.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const addPortfolioURL = () => {
    setFormData(prev => ({
      ...prev,
      portfolio_urls: [...prev.portfolio_urls, '']
    }));
  };

  const updatePortfolioURL = (index: number, value: string) => {
    const newUrls = [...formData.portfolio_urls];
    newUrls[index] = value;
    setFormData(prev => ({ ...prev, portfolio_urls: newUrls }));
  };

  const removePortfolioURL = (index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolio_urls: prev.portfolio_urls.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Become a <span className="text-indigo-600">Creator</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of creators selling their products, digital goods, and services in AI City's magical marketplace
          </p>
          
          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-2">🎨</div>
              <h3 className="font-bold text-gray-900">Your Brand</h3>
              <p className="text-sm text-gray-600 mt-2">Full control over your storefront and brand identity</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-2">🤖</div>
              <h3 className="font-bold text-gray-900">AI Powered</h3>
              <p className="text-sm text-gray-600 mt-2">AI assistant helps with descriptions, pricing, and support</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="font-bold text-gray-900">Keep More</h3>
              <p className="text-sm text-gray-600 mt-2">85-90% of revenue goes directly to you</p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= s 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > s ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={step >= 1 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>About You</span>
            <span className={step >= 2 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>Portfolio</span>
            <span className={step >= 3 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>Location</span>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            
            {/* Step 1: About You */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Your awesome brand name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="craft">Craft & Handmade</option>
                    <option value="digital">Digital Products</option>
                    <option value="wellness">Wellness & Self-Care</option>
                    <option value="tech">Technology & Gadgets</option>
                    <option value="art">Art & Design</option>
                    <option value="ritual">Spiritual & Ritual Items</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level *
                  </label>
                  <select
                    required
                    value={formData.experience_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience_level: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="beginner">Beginner (Just starting out)</option>
                    <option value="intermediate">Intermediate (Some experience)</option>
                    <option value="professional">Professional (Established business)</option>
                    <option value="master">Master (Industry expert)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Story * 
                    <span className="text-gray-500 font-normal ml-2">(Tell us your journey)</span>
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.brand_story}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand_story: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="What inspired you to create? What makes your products unique? Share your passion..."
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Minimum 100 characters. Great stories help customers connect with your brand!
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Portfolio */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Portfolio Links
                    <span className="text-gray-500 font-normal ml-2">(Show us your work)</span>
                  </label>
                  {formData.portfolio_urls.map((url, index) => (
                    <div key={index} className="flex gap-2 mb-3">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => updatePortfolioURL(index, e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="https://your-portfolio.com"
                      />
                      {formData.portfolio_urls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePortfolioURL(index)}
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPortfolioURL}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    + Add another link
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={formData.social_links.instagram}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        social_links: { ...prev.social_links, instagram: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="@yourusername"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter/X
                    </label>
                    <input
                      type="text"
                      value={formData.social_links.twitter}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        social_links: { ...prev.social_links, twitter: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="@yourusername"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.social_links.website}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        social_links: { ...prev.social_links, website: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://yoursite.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-indigo-50 rounded-lg p-6 mb-6">
                  <h3 className="font-bold text-indigo-900 mb-2">Choose Your Location</h3>
                  <p className="text-indigo-700 text-sm">
                    Your storefront will be placed in one of AI City's halls. Each hall has its own vibe and customer base.
                    We'll try to honor your preference!
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Hall
                  </label>
                  <select
                    value={formData.requested_hall}
                    onChange={(e) => setFormData(prev => ({ ...prev, requested_hall: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">No preference (we'll choose for you)</option>
                    <option value="digital-dreams">Digital Dreams Hall (Tech & Digital)</option>
                    <option value="artisan-quarter">Artisan Quarter (Handmade & Craft)</option>
                    <option value="wellness-sanctuary">Wellness Sanctuary (Health & Mindfulness)</option>
                    <option value="mystic-bazaar">Mystic Bazaar (Spiritual & Ritual)</option>
                    <option value="creative-commons">Creative Commons (Art & Design)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Street (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.requested_street}
                    onChange={(e) => setFormData(prev => ({ ...prev, requested_street: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Innovation Avenue, Serenity Street"
                  />
                </div>

                {/* Pricing Summary */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="font-bold text-yellow-900 mb-3">💰 Pricing</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-yellow-800">Application Fee (one-time)</span>
                      <span className="font-bold text-yellow-900">$99.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-800">Monthly Storefront Fee</span>
                      <span className="font-bold text-yellow-900">$49.00</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-yellow-200">
                      <span className="text-yellow-800">Platform Commission</span>
                      <span className="font-bold text-yellow-900">15%</span>
                    </div>
                  </div>
                  <p className="text-xs text-yellow-700 mt-3">
                    Upgrade to Premium ($99/mo, 12% commission) or Enterprise ($199/mo, 10% commission) anytime!
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  ← Previous
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="ml-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="ml-auto px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                >
                  {submitting ? 'Submitting...' : 'Submit Application 🚀'}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* FAQ */}
        <div className="mt-12 bg-white rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900">How long does review take?</h3>
              <p className="text-gray-600 mt-1">Most applications are reviewed within 2-3 business days.</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">What happens after approval?</h3>
              <p className="text-gray-600 mt-1">You'll get an email to set up your storefront and can start listing products immediately!</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Can I sell internationally?</h3>
              <p className="text-gray-600 mt-1">Yes! AI City supports 60+ countries and 40+ currencies with automatic conversion.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
