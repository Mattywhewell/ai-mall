/**
 * AI Concierge Preferences Page
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Sparkles, Bell, Heart, MessageCircle, Globe, Shield } from 'lucide-react';

export default function AIConciergePreferences() {
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    personalityType: 'friendly',
    responseStyle: 'detailed',
    language: 'en',
    interests: ['technology', 'fashion'],
    budget: 'medium',
    communicationFrequency: 'balanced',
    proactiveRecommendations: true,
    emotionalTone: true,
    personalizedGreeting: true,
    rememberpast: true,
    shareData: false,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Save preferences to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/ai-concierge"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to AI Concierge
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
            <Sparkles className="w-10 h-10 text-purple-600 mr-3" />
            AI Concierge Preferences
          </h1>
          <p className="text-gray-600">Customize your AI shopping assistant experience</p>
        </div>

        <div className="space-y-6">
          {/* Personality */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Personality & Style</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personality Type
                </label>
                <select
                  value={preferences.personalityType}
                  onChange={(e) => setPreferences({ ...preferences, personalityType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="professional">Professional - Formal and efficient</option>
                  <option value="friendly">Friendly - Warm and conversational</option>
                  <option value="casual">Casual - Relaxed and informal</option>
                  <option value="enthusiastic">Enthusiastic - Energetic and excited</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Style
                </label>
                <select
                  value={preferences.responseStyle}
                  onChange={(e) => setPreferences({ ...preferences, responseStyle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="brief">Brief - Short and concise answers</option>
                  <option value="balanced">Balanced - Moderate detail level</option>
                  <option value="detailed">Detailed - Comprehensive explanations</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Language
                </label>
                <select
                  value={preferences.language}
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>
            </div>
          </div>

          {/* Shopping Preferences */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Heart className="w-6 h-6 text-pink-600 mr-2" />
              Shopping Preferences
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Interests
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['technology', 'fashion', 'home', 'beauty', 'sports', 'books'].map((interest) => (
                    <label key={interest} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.interests.includes(interest)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPreferences({
                              ...preferences,
                              interests: [...preferences.interests, interest]
                            });
                          } else {
                            setPreferences({
                              ...preferences,
                              interests: preferences.interests.filter(i => i !== interest)
                            });
                          }
                        }}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm capitalize text-gray-700">{interest}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typical Budget Range
                </label>
                <select
                  value={preferences.budget}
                  onChange={(e) => setPreferences({ ...preferences, budget: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="low">Budget-Friendly ($0-$50)</option>
                  <option value="medium">Moderate ($50-$200)</option>
                  <option value="high">Premium ($200-$500)</option>
                  <option value="luxury">Luxury ($500+)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Communication */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <MessageCircle className="w-6 h-6 text-blue-600 mr-2" />
              Communication Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication Frequency
                </label>
                <select
                  value={preferences.communicationFrequency}
                  onChange={(e) => setPreferences({ ...preferences, communicationFrequency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="minimal">Minimal - Only when necessary</option>
                  <option value="balanced">Balanced - Regular updates</option>
                  <option value="frequent">Frequent - Stay in the loop</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <h3 className="font-medium text-gray-900">Proactive Recommendations</h3>
                    <p className="text-sm text-gray-600">Get personalized product suggestions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.proactiveRecommendations}
                      onChange={(e) => setPreferences({ ...preferences, proactiveRecommendations: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <h3 className="font-medium text-gray-900">Emotional Tone</h3>
                    <p className="text-sm text-gray-600">AI responds with emotional intelligence</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.emotionalTone}
                      onChange={(e) => setPreferences({ ...preferences, emotionalTone: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <h3 className="font-medium text-gray-900">Personalized Greeting</h3>
                    <p className="text-sm text-gray-600">Get greeted by name</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.personalizedGreeting}
                      onChange={(e) => setPreferences({ ...preferences, personalizedGreeting: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <h3 className="font-medium text-gray-900">Remember Past Conversations</h3>
                    <p className="text-sm text-gray-600">AI recalls previous interactions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.rememberpast}
                      onChange={(e) => setPreferences({ ...preferences, rememberpast: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="w-6 h-6 text-green-600 mr-2" />
              Privacy & Data
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <h3 className="font-medium text-gray-900">Share Data for Improvements</h3>
                  <p className="text-sm text-gray-600">Help improve AI recommendations</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.shareData}
                    onChange={(e) => setPreferences({ ...preferences, shareData: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Your privacy is important. We never share your personal data with third parties. 
                <Link href="/privacy" className="underline ml-1">Learn more</Link>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/ai-concierge"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
