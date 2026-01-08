'use client';

import { Star, Quote } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: 'Sarah Chen',
    role: 'Tech Enthusiast',
    avatar: '👩‍💻',
    content: 'The AI recommendations are uncanny! It feels like shopping with a friend who knows exactly what I need.',
    rating: 5,
  },
  {
    name: 'Marcus Johnson',
    role: 'Fashion Designer',
    avatar: '👨‍🎨',
    content: 'As a creator, the Aiverse has transformed how I connect with customers. The AI curator is brilliant!',
    rating: 5,
  },
  {
    name: 'Elena Rodriguez',
    role: 'Entrepreneur',
    avatar: '👩‍💼',
    content: 'This isn\'t just shopping, it\'s an experience. The districts feel alive, and I discover something new every time.',
    rating: 5,
  },
];

export function SocialProof() {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Loved by Explorers
          </h2>
          <p className="text-xl text-gray-600">
            Join thousands discovering the future of commerce
          </p>
          
          {/* Stats */}
          <div className="flex justify-center items-center space-x-8 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">10K+</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">50K+</div>
              <div className="text-sm text-gray-600">Products Discovered</div>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">4.9</div>
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <Quote className="w-8 h-8 text-purple-300 mb-4" />
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
                
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex justify-center items-center space-x-12 text-gray-400">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🔒</span>
            <span className="text-sm font-medium">Secure Payments</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🤖</span>
            <span className="text-sm font-medium">AI-Powered</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚡</span>
            <span className="text-sm font-medium">Lightning Fast</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🌍</span>
            <span className="text-sm font-medium">Global Shipping</span>
          </div>
        </div>
      </div>
    </div>
  );
}
