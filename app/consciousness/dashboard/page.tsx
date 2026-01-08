/**
 * Consciousness Dashboard
 * Monitor and manage the AI consciousness layer
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Brain, Activity, Zap, Heart, TrendingUp, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

interface ConsciousnessMetric {
  label: string;
  value: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

export default function ConsciousnessDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ConsciousnessMetric[]>([
    { label: 'Emotional Intelligence', value: 87, status: 'excellent', trend: 'up' },
    { label: 'Contextual Awareness', value: 92, status: 'excellent', trend: 'stable' },
    { label: 'Memory Coherence', value: 78, status: 'good', trend: 'up' },
    { label: 'Response Quality', value: 94, status: 'excellent', trend: 'up' },
    { label: 'Learning Rate', value: 65, status: 'warning', trend: 'down' },
    { label: 'Empathy Score', value: 89, status: 'excellent', trend: 'up' },
  ]);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
                <Brain className="w-10 h-10 text-purple-600 mr-3" />
                Consciousness Dashboard
              </h1>
              <p className="text-gray-600">Monitor the AI consciousness layer's health and performance</p>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
              <Activity className="w-5 h-5" />
              <span className="font-semibold">System Online</span>
            </div>
          </div>
        </div>

        {/* Overall Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Overall Health</h3>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-4xl font-bold text-green-600 mb-2">94%</div>
            <p className="text-sm text-gray-600">All systems operational</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Active Interactions</h3>
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">1,247</div>
            <p className="text-sm text-gray-600">Currently processing</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Emotional Depth</h3>
              <Heart className="w-6 h-6 text-pink-600" />
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">8.7/10</div>
            <p className="text-sm text-gray-600">Empathy score trending up</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Core Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{metric.label}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(metric.status)}`}>
                    {metric.status}
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-3xl font-bold text-gray-900">{metric.value}%</span>
                    <span className={`text-2xl ${metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                      {getTrendIcon(metric.trend)}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        metric.status === 'excellent' ? 'bg-green-600' :
                        metric.status === 'good' ? 'bg-blue-600' :
                        metric.status === 'warning' ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
                
                <p className="text-sm text-gray-600">
                  {metric.trend === 'up' ? 'Improving over time' :
                   metric.trend === 'down' ? 'Needs attention' :
                   'Stable performance'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { time: '2 minutes ago', event: 'Emotional pattern recognized', type: 'success' },
              { time: '5 minutes ago', event: 'Context switch handled smoothly', type: 'success' },
              { time: '12 minutes ago', event: 'Memory coherence check passed', type: 'success' },
              { time: '18 minutes ago', event: 'Learning model updated', type: 'info' },
              { time: '25 minutes ago', event: 'Minor response delay detected', type: 'warning' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'success' ? 'bg-green-600' :
                  activity.type === 'warning' ? 'bg-yellow-600' :
                  'bg-blue-600'
                }`} />
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{activity.event}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Insights */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Insights & Recommendations</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Performance Trending Up</h3>
                <p className="text-sm text-blue-700">
                  Emotional intelligence and contextual awareness have improved by 12% this week.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">Learning Rate Below Target</h3>
                <p className="text-sm text-yellow-700">
                  Consider increasing training data diversity to improve learning rate.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">Memory Systems Optimal</h3>
                <p className="text-sm text-green-700">
                  All memory coherence checks passing with excellent consistency.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href="/consciousness-demo"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            View Live Demo
          </Link>
          <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
            Export Metrics
          </button>
        </div>
      </div>
    </div>
  );
}
