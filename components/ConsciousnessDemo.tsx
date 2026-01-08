'use client';

import { useEffect, useState } from 'react';
import { CURATORS } from '@/lib/autonomous/ai-curator-system';

interface CuratorData {
  curator_name: string;
  curator: typeof CURATORS[keyof typeof CURATORS];
  relationship_stage: string;
  interactions_count: number;
  emotional_context?: {
    emotion: string;
    intensity: number;
    needs: string[];
  };
}

export default function ConsciousnessDemo() {
  const [emotionDetected, setEmotionDetected] = useState(false);
  const [curator, setCurator] = useState<CuratorData | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-detect emotion on mount
  useEffect(() => {
    detectEmotion();
  }, []);

  const detectEmotion = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/consciousness/detect-emotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recent_searches: ['meditation', 'stress relief'],
          browsing_speed: 'slow',
          navigation_pattern: 'scattered',
          time_of_day: new Date().getHours(),
          repeat_visits_today: 1,
          cart_abandonment_count: 0,
          viewed_chapels: ['Serenity', 'Contemplation'],
        }),
      });

      const data = await response.json();
      if (data.success) {
        setEmotionDetected(true);
        console.log('Emotional state detected:', data.emotional_state);
        
        // Auto-match curator
        await matchCurator();
      }
    } catch (error) {
      console.error('Failed to detect emotion:', error);
    } finally {
      setLoading(false);
    }
  };

  const matchCurator = async () => {
    try {
      const response = await fetch('/api/consciousness/match-curator');
      const data = await response.json();
      setCurator(data);
      
      // Get greeting
      await getCuratorMessage(data.curator_name, 'greeting');
    } catch (error) {
      console.error('Failed to match curator:', error);
    }
  };

  const getCuratorMessage = async (curatorName: string, occasion: string) => {
    try {
      const response = await fetch('/api/consciousness/curator-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curator_name: curatorName,
          occasion,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage(data.message);
      }
    } catch (error) {
      console.error('Failed to get curator message:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Detecting your emotional state...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">🌊 Consciousness Layer Demo</h1>
        <p className="text-gray-600">Experience AI that understands and cares</p>
      </div>

      {/* Emotion Status */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-3 h-3 rounded-full ${emotionDetected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <h2 className="text-xl font-semibold">Emotional Intelligence</h2>
        </div>
        {emotionDetected ? (
          <p className="text-green-700">✓ Your emotional state has been detected</p>
        ) : (
          <button
            onClick={detectEmotion}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Detect My Emotional State
          </button>
        )}
      </div>

      {/* Curator Match */}
      {curator && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">👥 Your AI Curator</h2>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-start gap-4">
              <div className="text-4xl">✨</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-purple-900">
                  {curator.curator.name}
                </h3>
                <p className="text-purple-700 mb-2">{curator.curator.title}</p>
                <p className="text-gray-600 mb-4">{curator.curator.personality}</p>
                
                <div className="bg-purple-50 p-4 rounded-lg mb-4">
                  <p className="italic text-purple-800">
                    "{curator.curator.signature_phrase}"
                  </p>
                </div>

                {curator.emotional_context && (
                  <div className="flex gap-4 text-sm">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      Emotion: {curator.emotional_context.emotion}
                    </span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      Stage: {curator.relationship_stage}
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                      Interactions: {curator.interactions_count}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Curator Message */}
      {message && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">💬 Message from {curator?.curator.name}</h2>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-gray-800 text-lg leading-relaxed">{message}</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {curator && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => getCuratorMessage(curator.curator_name, 'check-in')}
            className="bg-white border-2 border-purple-200 p-4 rounded-lg hover:bg-purple-50 transition"
          >
            <div className="text-2xl mb-2">💭</div>
            <div className="font-semibold">Check In</div>
          </button>
          
          <button
            onClick={() => getCuratorMessage(curator.curator_name, 'recommendation')}
            className="bg-white border-2 border-blue-200 p-4 rounded-lg hover:bg-blue-50 transition"
          >
            <div className="text-2xl mb-2">🎁</div>
            <div className="font-semibold">Get Recommendation</div>
          </button>
          
          <button
            onClick={() => getCuratorMessage(curator.curator_name, 'support')}
            className="bg-white border-2 border-green-200 p-4 rounded-lg hover:bg-green-50 transition"
          >
            <div className="text-2xl mb-2">🤲</div>
            <div className="font-semibold">Ask for Support</div>
          </button>
        </div>
      )}

      {/* View Full Status */}
      <div className="text-center">
        <a
          href="/consciousness/dashboard"
          className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold"
        >
          View Full Consciousness Dashboard →
        </a>
      </div>
    </div>
  );
}
