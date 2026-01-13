'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, Sparkles, Building2, Eye, Compass, Star } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/tracking';

interface UserProgress {
  hasVisitedCity: boolean;
  hasCreatedAccount: boolean;
  hasBrowsedMarketplace: boolean;
  hasJoinedCreatorProgram: boolean;
  preferredPath: 'explorer' | 'creator' | 'shopper' | null;
}

export default function ProgressiveNavigation() {
  const [userProgress, setUserProgress] = useState<UserProgress>({
    hasVisitedCity: false,
    hasCreatedAccount: false,
    hasBrowsedMarketplace: false,
    hasJoinedCreatorProgram: false,
    preferredPath: null
  });

  const [currentPhase, setCurrentPhase] = useState<'onboarding' | 'experienced' | 'expert'>('onboarding');

  useEffect(() => {
    // Load user progress from localStorage
    const savedProgress = localStorage.getItem('user-navigation-progress');
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setUserProgress(progress);

        // Determine user phase based on progress
        const { hasVisitedCity, hasCreatedAccount, hasBrowsedMarketplace, hasJoinedCreatorProgram } = progress;
        const actions = [hasVisitedCity, hasCreatedAccount, hasBrowsedMarketplace, hasJoinedCreatorProgram].filter(Boolean).length;

        if (actions >= 3) {
          setCurrentPhase('expert');
        } else if (actions >= 1) {
          setCurrentPhase('experienced');
        } else {
          setCurrentPhase('onboarding');
        }
      } catch (error) {
        console.log('Could not load user progress');
      }
    }
  }, []);

  const updateProgress = (action: keyof UserProgress) => {
    const newProgress = { ...userProgress, [action]: true };
    setUserProgress(newProgress);
    localStorage.setItem('user-navigation-progress', JSON.stringify(newProgress));
  };

  const handleCityVisit = () => {
    updateProgress('hasVisitedCity');
    if (!userProgress.preferredPath) {
      setUserProgress(prev => ({ ...prev, preferredPath: 'explorer' }));
    }
    // Track navigation event
    trackEvent({
      event_type: 'click',
      metadata: {
        action: 'navigation',
        destination: 'city',
        user_phase: currentPhase,
        source: 'progressive_navigation'
      }
    });
  };

  const handleMarketplaceVisit = () => {
    updateProgress('hasBrowsedMarketplace');
    if (!userProgress.preferredPath) {
      setUserProgress(prev => ({ ...prev, preferredPath: 'shopper' }));
    }
    // Track navigation event
    trackEvent({
      event_type: 'click',
      metadata: {
        action: 'navigation',
        destination: 'marketplace',
        user_phase: currentPhase,
        source: 'progressive_navigation'
      }
    });
  };

  const handleCreatorJoin = () => {
    updateProgress('hasJoinedCreatorProgram');
    if (!userProgress.preferredPath) {
      setUserProgress(prev => ({ ...prev, preferredPath: 'creator' }));
    }
    // Track navigation event
    trackEvent({
      event_type: 'click',
      metadata: {
        action: 'navigation',
        destination: 'creator',
        user_phase: currentPhase,
        source: 'progressive_navigation'
      }
    });
  };

  const handleContinueJourney = () => {
    trackEvent({
      event_type: 'click',
      metadata: {
        action: 'navigation',
        destination: 'continue_journey',
        user_phase: currentPhase,
        preferred_path: userProgress.preferredPath,
        source: 'progressive_navigation'
      }
    });
  };

  const handleExploreDistricts = () => {
    trackEvent({
      event_type: 'click',
      metadata: {
        action: 'navigation',
        destination: 'districts',
        user_phase: currentPhase,
        source: 'progressive_navigation'
      }
    });
  };

  const handleExpertNavigation = (destination: string) => {
    trackEvent({
      event_type: 'click',
      metadata: {
        action: 'navigation',
        destination,
        user_phase: currentPhase,
        source: 'progressive_navigation'
      }
    });
  };

  // Onboarding phase - show all 3 clear paths
  if (currentPhase === 'onboarding') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {/* Path 1: Experience the City */}
        <Link
          href="/city"
          onClick={handleCityVisit}
          className="group bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 hover:border-purple-400/60 transition-all duration-300 hover:transform hover:scale-105"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Experience the City</h3>
            <p className="text-sm text-purple-200 mb-4">Enter the living AI metropolis</p>
            <div className="flex items-center justify-center text-purple-300 group-hover:text-white transition-colors">
              <span className="text-sm font-medium">Enter Aiverse</span>
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Path 2: Join as Creator */}
        <Link
          href="/creator"
          onClick={handleCreatorJoin}
          className="group bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-6 hover:border-emerald-400/60 transition-all duration-300 hover:transform hover:scale-105"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Join as Creator</h3>
            <p className="text-sm text-emerald-200 mb-4">Build your AI storefront</p>
            <div className="flex items-center justify-center text-emerald-300 group-hover:text-white transition-colors">
              <span className="text-sm font-medium">Start Creating</span>
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Path 3: Browse Marketplace */}
        <Link
          href="/discover"
          onClick={handleMarketplaceVisit}
          className="group bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/60 transition-all duration-300 hover:transform hover:scale-105"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Browse Marketplace</h3>
            <p className="text-sm text-blue-200 mb-4">Discover AI-powered products</p>
            <div className="flex items-center justify-center text-blue-300 group-hover:text-white transition-colors">
              <span className="text-sm font-medium">Shop Now</span>
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Experienced user - show personalized recommendations
  if (currentPhase === 'experienced') {
    const recommendedPath = userProgress.preferredPath || 'explorer';

    return (
      <div className="space-y-6">
        {/* Personalized recommendation */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Welcome back!</h3>
          <p className="text-gray-300">Based on your activity, we recommend:</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Primary recommendation based on user preference */}
          <Link
            href={recommendedPath === 'explorer' ? '/city' : recommendedPath === 'creator' ? '/creator/dashboard' : '/discover'}
            onClick={handleContinueJourney}
            className="group bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 hover:border-purple-400/60 transition-all duration-300 hover:transform hover:scale-105"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {recommendedPath === 'explorer' ? 'Continue Exploring' :
                 recommendedPath === 'creator' ? 'Your Dashboard' : 'Continue Shopping'}
              </h3>
              <p className="text-sm text-purple-200 mb-4">Pick up where you left off</p>
              <div className="flex items-center justify-center text-purple-300 group-hover:text-white transition-colors">
                <span className="text-sm font-medium">Continue</span>
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Alternative path */}
          <Link
            href="/districts"
            onClick={handleExploreDistricts}
            className="group bg-gradient-to-br from-slate-600/20 to-slate-700/20 backdrop-blur-sm border border-slate-500/30 rounded-2xl p-6 hover:border-slate-400/60 transition-all duration-300 hover:transform hover:scale-105"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-slate-500 to-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Explore Districts</h3>
              <p className="text-sm text-slate-200 mb-4">Discover new areas of Aiverse</p>
              <div className="flex items-center justify-center text-slate-300 group-hover:text-white transition-colors">
                <span className="text-sm font-medium">Explore</span>
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Quick access to all paths */}
        <div className="text-center">
          <details className="group">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
              View all options
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 max-w-4xl mx-auto">
              <Link href="/city" className="text-sm text-purple-300 hover:text-purple-200 transition-colors">🏙️ City Experience</Link>
              <Link href="/creator" className="text-sm text-emerald-300 hover:text-emerald-200 transition-colors">✨ Creator Program</Link>
              <Link href="/discover" className="text-sm text-blue-300 hover:text-blue-200 transition-colors">🛒 Marketplace</Link>
            </div>
          </details>
        </div>
      </div>
    );
  }

  // Expert user - show advanced options
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Welcome, Aiverse Explorer!</h3>
        <p className="text-gray-300">Access advanced features and deep experiences:</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        <Link href="/city" onClick={() => handleExpertNavigation('deep_city')} className="group bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 hover:border-purple-400/60 transition-all duration-300 hover:transform hover:scale-105">
          <div className="text-center">
            <MapPin className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-white mb-1">Deep City</h4>
            <p className="text-xs text-purple-200">Advanced exploration</p>
          </div>
        </Link>

        <Link href="/ai-city/explore" onClick={() => handleExpertNavigation('ai_explorer')} className="group bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 hover:border-blue-400/60 transition-all duration-300 hover:transform hover:scale-105">
          <div className="text-center">
            <Eye className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-white mb-1">AI Explorer</h4>
            <p className="text-xs text-blue-200">Citizen interactions</p>
          </div>
        </Link>

        <Link href="/creator/dashboard" onClick={() => handleExpertNavigation('creator_hub')} className="group bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-4 hover:border-emerald-400/60 transition-all duration-300 hover:transform hover:scale-105">
          <div className="text-center">
            <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-white mb-1">Creator Hub</h4>
            <p className="text-xs text-emerald-200">Advanced tools</p>
          </div>
        </Link>

        <Link href="/admin/dashboard" onClick={() => handleExpertNavigation('admin_panel')} className="group bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-sm border border-amber-500/30 rounded-xl p-4 hover:border-amber-400/60 transition-all duration-300 hover:transform hover:scale-105">
          <div className="text-center">
            <Building2 className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-white mb-1">Admin Panel</h4>
            <p className="text-xs text-amber-200">System control</p>
          </div>
        </Link>
      </div>
    </div>
  );
}