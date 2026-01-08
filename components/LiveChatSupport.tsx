'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Paperclip, Minimize2, Bot, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabaseClient';

type Message = {
  id: string;
  sender_type: 'user' | 'agent' | 'bot';
  message: string;
  created_at: string;
};

export function LiveChatSupport() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [agentName, setAgentName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickReplies = [
    'Track my order',
    'Return policy',
    'Payment issues',
    'Product availability',
  ];

  useEffect(() => {
    if (isOpen && !conversationId) {
      initializeConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeConversation = async () => {
    try {
      // Create or get existing conversation
      const sessionId = user ? undefined : `anon_${Date.now()}`;
      
      const { data: conversation, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user?.id,
          session_id: sessionId,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;
      setConversationId(conversation.id);

      // Send welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        sender_type: 'bot',
        message: user
          ? `Hi ${user.email}! I'm your AI assistant. How can I help you today?`
          : "Hi there! I'm your AI assistant. How can I help you today?",
        created_at: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };


  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversationId) return;

    const userMessage: Message = {
      id: `temp_${Date.now()}`,
      sender_type: 'user',
      message: inputMessage,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Save message to database
      await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        sender_id: user?.id,
        sender_type: 'user',
        message: inputMessage,
      });

      // Call AI Concierge API for natural language response
      const res = await fetch('/api/ai-concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || conversationId, // fallback to session id for anon
          message: inputMessage,
        }),
      });

      if (!res.ok) {
        throw new Error('AI Concierge error');
      }
      const data = await res.json();
      const aiText = data.response || 'Sorry, I could not process your request.';

      const botResponse: Message = {
        id: `bot_${Date.now()}`,
        sender_type: 'bot',
        message: aiText,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    }
  };

  // getAIResponse is now handled by the backend AI Concierge API

  const handleQuickReply = (reply: string) => {
    setInputMessage(reply);
  };

  const handleEscalateToHuman = async () => {
    if (!conversationId) return;

    try {
      await supabase
        .from('chat_conversations')
        .update({ status: 'assigned', priority: 'high' })
        .eq('id', conversationId);

      const escalationMessage: Message = {
        id: `escalate_${Date.now()}`,
        sender_type: 'bot',
        message: 'Connecting you to a human agent... Please hold on.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, escalationMessage]);
    } catch (error) {
      console.error('Error escalating:', error);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 hover:scale-110 transition-all duration-300 animate-bounce"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">Chat Support</span>
          {messages.length > 1 && (
            <span className="px-2 py-0.5 bg-white text-purple-600 text-xs rounded-full font-bold">
              {messages.length - 1}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">Live Support</h3>
            <p className="text-xs text-purple-100">
              {agentName ? `Agent: ${agentName}` : 'AI Assistant • Online'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                msg.sender_type === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              <p className="text-sm">{msg.message}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-white border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => handleQuickReply(reply)}
                className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs hover:bg-purple-100 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={handleEscalateToHuman}
          className="w-full mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium"
        >
          Talk to a human agent →
        </button>
      </div>
    </div>
  );
}
