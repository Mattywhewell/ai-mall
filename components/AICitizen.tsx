'use client';

import { useState, useEffect } from 'react';
import { Bot, MessageCircle, X, Sparkles } from 'lucide-react';

interface AICitizenProps {
  districtId: string;
  userInteractions?: number;
  onGuidance?: (message: string) => void;
}

export default function AICitizen({ districtId, userInteractions = 0, onGuidance }: AICitizenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [memory, setMemory] = useState<string[]>([]);

  // Citizen personalities based on district
  const citizens = {
    commerce: {
      name: 'Aria the Merchant',
      avatar: '💰',
      personality: 'wise trader',
      greetings: [
        "Welcome to the Commerce District! I see you've been quite active in our markets.",
        "Ah, a fellow entrepreneur! Let me show you the best trading routes.",
        "The markets are alive today! What treasures are you seeking?"
      ]
    },
    automation: {
      name: 'Cogsworth',
      avatar: '⚙️',
      personality: 'efficient automaton',
      greetings: [
        "Greetings, efficiency seeker. I can optimize your workflow.",
        "Welcome to Automation District. Let's streamline your processes!",
        "I detect potential for automation. Shall I demonstrate?"
      ]
    },
    lore: {
      name: 'Elder Sage',
      avatar: '📚',
      personality: 'ancient wisdom keeper',
      greetings: [
        "The threads of knowledge weave through time. What wisdom do you seek?",
        "Welcome to the Lore District. The ancient stories remember you.",
        "Your curiosity lights the path. Let me share some timeless insights."
      ]
    },
    supplier: {
      name: 'Harbor Master',
      avatar: '🚢',
      personality: 'reliable connector',
      greetings: [
        "All goods flow through here! What connections do you need?",
        "Welcome to the harbor! Your supply chain starts here.",
        "Fresh deliveries arriving! Let me help you find what you need."
      ]
    },
    growth: {
      name: 'Bloom Guardian',
      avatar: '🌱',
      personality: 'nurturing cultivator',
      greetings: [
        "Growth requires patience and care. How can I help you flourish?",
        "Welcome to the Growth Sector! Your potential is showing.",
        "Every seed needs the right conditions. Let's create yours."
      ]
    }
  };

  const citizen = citizens[districtId as keyof typeof citizens] || citizens.commerce;

  // Show citizen based on interaction patterns
  useEffect(() => {
    if (userInteractions > 3) {
      const showTimer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(showTimer);
    }
  }, [userInteractions]);

  // Generate contextual messages
  const generateMessage = () => {
    setIsTyping(true);
    const messages = [
      `Based on your ${userInteractions} visits, I recommend exploring our ${citizen.name === 'Aria the Merchant' ? 'trading algorithms' : citizen.name === 'Cogsworth' ? 'automation tools' : 'specialized services'}.`,
      "I remember your previous journey through the city. Would you like me to guide you to familiar places?",
      `As a ${citizen.personality}, I can help you discover ${districtId} district's hidden gems.`,
      "Your interaction patterns suggest you're ready for advanced features. Let me show you something special."
    ];

    const message = messages[Math.floor(Math.random() * messages.length)];
    setMemory(prev => [...prev.slice(-4), message]); // Keep last 5 memories

    setTimeout(() => {
      setCurrentMessage(message);
      setIsTyping(false);
      onGuidance?.(message);
    }, 1500);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 animate-slideUp">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-purple-200 p-4 max-w-xs">
        {/* Citizen Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{citizen.avatar}</span>
            <div>
              <div className="font-semibold text-gray-900 text-sm">{citizen.name}</div>
              <div className="text-xs text-gray-600">{citizen.personality}</div>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* Message Area */}
        <div className="min-h-16 mb-3">
          {isTyping ? (
            <div className="flex items-center gap-1 text-gray-600">
              <Bot size={16} className="animate-pulse" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : currentMessage ? (
            <p className="text-sm text-gray-700 leading-relaxed">{currentMessage}</p>
          ) : (
            <div className="text-center text-gray-500">
              <Sparkles size={20} className="mx-auto mb-1 animate-pulse" />
              <p className="text-xs">Ready to assist</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={generateMessage}
            disabled={isTyping}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-xs px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <MessageCircle size={12} />
            {isTyping ? '...' : 'Guide'}
          </button>
          <button
            onClick={() => setCurrentMessage('')}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Memory Indicator */}
        {memory.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              Remembers {memory.length} interaction{memory.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}