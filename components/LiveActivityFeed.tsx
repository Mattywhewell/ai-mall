'use client';

import { useEffect, useState } from 'react';
import { Activity, TrendingUp, Users, Zap } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'discovery' | 'purchase' | 'curator' | 'trending';
  message: string;
  timestamp: Date;
  icon: 'activity' | 'trending' | 'users' | 'zap';
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    // Generate initial activities
    const initialActivities = generateRandomActivities(5);
    setActivities(initialActivities);
    setOnlineCount(Math.floor(Math.random() * 200) + 100);

    // Simulate real-time updates
    const interval = setInterval(() => {
      const newActivity = generateRandomActivities(1)[0];
      setActivities((prev) => [newActivity, ...prev].slice(0, 5));
      
      // Randomly update online count
      setOnlineCount((prev) => {
        const change = Math.floor(Math.random() * 10) - 5;
        return Math.max(50, prev + change);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const generateRandomActivities = (count: number): ActivityItem[] => {
    const templates = [
      {
        type: 'curator' as const,
        messages: [
          'AI Curator #47 discovered 3 new products in Fashion District',
          'AI Agent analyzing trending items in Tech Hub',
          'Neural Curator updated recommendations for you',
          'AI optimizing product placements across districts',
        ],
        icon: 'zap' as const,
      },
      {
        type: 'discovery' as const,
        messages: [
          'Someone just discovered a hidden gem in Prestige Pavilion',
          'New arrival: Exclusive item in Radiance Sanctuary',
          '5 people exploring Neural Tech Hub right now',
          'Trending search: "sustainable home goods"',
        ],
        icon: 'activity' as const,
      },
      {
        type: 'trending' as const,
        messages: [
          'Fashion District is trending +32% today',
          'Hot item: AI-powered smart watch in Tech Hub',
          'Most visited: Ethereal Fashion District this hour',
          'Viral product spreading across 3 districts',
        ],
        icon: 'trending' as const,
      },
      {
        type: 'purchase' as const,
        messages: [
          'Just sold: Premium item from Artisan Flavor Market',
          'Someone from New York just made a purchase',
          '12 items added to carts in the last minute',
          'Flash deal claimed in Digital Playground',
        ],
        icon: 'users' as const,
      },
    ];

    return Array.from({ length: count }, () => {
      const template = templates[Math.floor(Math.random() * templates.length)];
      const message = template.messages[Math.floor(Math.random() * template.messages.length)];
      
      return {
        id: `${Date.now()}-${Math.random()}`,
        type: template.type,
        message,
        timestamp: new Date(),
        icon: template.icon,
      };
    });
  };

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      case 'users':
        return <Users className="w-4 h-4" />;
      case 'zap':
        return <Zap className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'curator':
        return 'text-purple-600 bg-purple-100';
      case 'trending':
        return 'text-pink-600 bg-pink-100';
      case 'purchase':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Live Activity</h3>
            <p className="text-sm text-gray-500">Real-time happenings in the Aiverse</p>
          </div>
        </div>
        
        {/* Online Counter */}
        <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold text-green-700">{onlineCount} online</span>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={`p-2 rounded-lg ${getColor(activity.type)}`}>
              {getIcon(activity.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700">{activity.message}</p>
              <p className="text-xs text-gray-400 mt-1">Just now</p>
            </div>
          </div>
        ))}
      </div>

      {/* View All Link */}
      <button className="w-full mt-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-semibold transition-colors">
        View all activity →
      </button>
    </div>
  );
}
