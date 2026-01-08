'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Message {
  role: 'user' | 'agent';
  content: string;
  products?: any[];
  timestamp: Date;
}

interface ShoppingAgent {
  id: string;
  agent_name: string;
  personality: string;
  avatar_url?: string;
  total_interactions: number;
  favorite_categories: string[];
  color_preferences: string[];
}

export default function AIConciergePage() {
  const [agent, setAgent] = useState<ShoppingAgent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAgent();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAgent = async () => {
    try {
      const userId = 'demo-user'; // Replace with actual user ID from auth
      const response = await fetch(`/api/ai-concierge?userId=${userId}`);
      const data = await response.json();
      
      setAgent(data.agent);
      setRecommendations(data.recommendations || []);

      // Welcome message
      if (data.agent) {
        setMessages([{
          role: 'agent',
          content: `Hi! I'm ${data.agent.agent_name}, your personal shopping assistant in AI City. I'm here to help you discover amazing products from talented creators. What are you looking for today?`,
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('Error loading agent:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const userId = 'demo-user';
      const response = await fetch('/api/ai-concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: input,
        }),
      });

      const data = await response.json();

      const agentMessage: Message = {
        role: 'agent',
        content: data.response,
        products: data.products,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, agentMessage]);

      if (data.products && data.products.length > 0) {
        setRecommendations(prev => [...data.products, ...prev].slice(0, 6));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'agent',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again!",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {agent?.agent_name[0] || '🤖'}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {agent?.agent_name || 'Your AI Shopping Assistant'}
              </h1>
              <p className="text-gray-600">
                {agent ? `${agent.total_interactions} conversations • ${agent.personality} personality` : 'Loading...'}
              </p>
            </div>
            <Link
              href="/ai-concierge/preferences"
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
            >
              Customize
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg flex flex-col h-[600px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => (
                  <div key={index}>
                    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>

                    {/* Product Suggestions */}
                    {message.products && message.products.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.products.map((product: any) => (
                          <Link
                            key={product.id}
                            href={`/storefront/${product.creator.slug}?product=${product.id}`}
                            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
                          >
                            {product.images?.[0] && (
                              <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm truncate">
                                {product.name}
                              </h4>
                              <p className="text-xs text-gray-600 truncate">
                                by {product.creator.brand_name}
                              </p>
                              <p className="text-sm font-bold text-indigo-600 mt-1">
                                ${product.price}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about products..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    Send
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Try: "Show me handmade jewelry" or "I need a gift for my mom"
                </p>
              </div>
            </div>
          </div>

          {/* Recommendations Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                ✨ Picked For You
              </h2>
              <div className="space-y-3">
                {recommendations.length > 0 ? (
                  recommendations.slice(0, 4).map((rec: any) => (
                    <Link
                      key={rec.id}
                      href={`/storefront/${rec.product?.creator?.slug}?product=${rec.product_id}`}
                      className="block group"
                    >
                      <div className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition">
                        {rec.product?.images?.[0] && (
                          <div className="w-full h-32 relative rounded-lg overflow-hidden mb-2">
                            <Image
                              src={rec.product.images[0]}
                              alt={rec.product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition"
                            />
                          </div>
                        )}
                        <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                          {rec.product?.name}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                          {rec.product?.creator?.brand_name}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-indigo-600">
                            ${rec.product?.price}
                          </span>
                          <span className="text-xs text-gray-500">
                            {Math.round(rec.confidence_score * 100)}% match
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic">
                          {rec.reason}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Start chatting to get personalized recommendations!
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="font-bold text-lg mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setInput("Show me trending products")}
                  className="w-full text-left px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition"
                >
                  🔥 Trending Now
                </button>
                <button
                  onClick={() => setInput("What's on sale?")}
                  className="w-full text-left px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition"
                >
                  💰 Best Deals
                </button>
                <button
                  onClick={() => setInput("Help me find a gift")}
                  className="w-full text-left px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition"
                >
                  🎁 Gift Ideas
                </button>
                <button
                  onClick={() => setInput("Show me new arrivals")}
                  className="w-full text-left px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition"
                >
                  ✨ New Arrivals
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
