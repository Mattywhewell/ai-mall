'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, Sparkles, MapPin, ShoppingBag } from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  icon: any;
}

const steps: OnboardingStep[] = [
  {
    title: 'Welcome to Aiverse! 👋',
    description: 'The world\'s first AI-native civilization. Let us show you around!',
    icon: Sparkles,
  },
  {
    title: 'Explore Districts',
    description: 'Each district is an AI-curated shopping world with unique products and experiences.',
    icon: MapPin,
  },
  {
    title: 'Your AI Guide',
    description: 'Your personal AI assistant is always ready to help you discover, shop, and create.',
    icon: Sparkles,
  },
  {
    title: 'Start Discovering',
    description: 'Ready to explore? Your journey through the Aiverse begins now!',
    icon: ShoppingBag,
  },
];

export function OnboardingFlow() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsVisible(false);
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const Icon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white relative">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-white/20 rounded-2xl">
              <Icon className="w-12 h-12" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {steps[currentStep].description}
            </p>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center space-x-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-purple-600'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center space-x-2"
            >
              <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Skip Option */}
          {currentStep < steps.length - 1 && (
            <button
              onClick={handleSkip}
              className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip tutorial
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
