'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  TrendingUp,
  Eye,
  Clock,
  Map,
  MessageCircle,
  Heart,
  ShoppingCart,
  BarChart3,
  PieChart,
  Activity,
  Globe,
  Target,
  Zap
} from 'lucide-react';

interface UserSession {
  id: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  duration: number;
  districtsVisited: string[];
  interactions: number;
  purchases: number;
  path: Array<{ x: number; y: number; z: number; timestamp: string }>;
}

interface EngagementMetric {
  metric: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
}

interface DistrictAnalytics {
  name: string;
  visitors: number;
  avgTime: number;
  engagement: number;
  conversion: number;
  topActivities: string[];
}

interface UserSegment {
  name: string;
  count: number;
  percentage: number;
  avgSessionTime: number;
  avgInteractions: number;
  characteristics: string[];
}

const mockSessions: UserSession[] = [
  {
    id: '1',
    userId: 'user_123',
    userName: 'Alex Chen',
    startTime: '2024-01-15T14:00:00Z',
    endTime: '2024-01-15T14:45:00Z',
    duration: 45,
    districtsVisited: ['Wonder District', 'Creative Commons'],
    interactions: 23,
    purchases: 1,
    path: [
      { x: 0, y: 0, z: 0, timestamp: '2024-01-15T14:00:00Z' },
      { x: 25, y: 0, z: 30, timestamp: '2024-01-15T14:15:00Z' },
      { x: 175, y: 0, z: 15, timestamp: '2024-01-15T14:30:00Z' }
    ]
  },
  {
    id: '2',
    userId: 'user_456',
    userName: 'Maya Patel',
    startTime: '2024-01-15T13:30:00Z',
    endTime: '2024-01-15T14:20:00Z',
    duration: 50,
    districtsVisited: ['Creative Commons', 'Wonder District'],
    interactions: 31,
    purchases: 2,
    path: [
      { x: 150, y: 0, z: 0, timestamp: '2024-01-15T13:30:00Z' },
      { x: 175, y: 0, z: 15, timestamp: '2024-01-15T13:45:00Z' },
      { x: 25, y: 0, z: 30, timestamp: '2024-01-15T14:00:00Z' }
    ]
  }
];

const mockEngagementMetrics: EngagementMetric[] = [
  {
    metric: 'Active Users',
    value: 1250,
    change: 12.5,
    trend: 'up',
    icon: <Users className="w-5 h-5" />
  },
  {
    metric: 'Avg Session Time',
    value: 42,
    change: 8.3,
    trend: 'up',
    icon: <Clock className="w-5 h-5" />
  },
  {
    metric: 'Total Interactions',
    value: 15420,
    change: -2.1,
    trend: 'down',
    icon: <Activity className="w-5 h-5" />
  },
  {
    metric: 'Conversion Rate',
    value: 3.2,
    change: 15.7,
    trend: 'up',
    icon: <ShoppingCart className="w-5 h-5" />
  }
];

const mockDistrictAnalytics: DistrictAnalytics[] = [
  {
    name: 'Wonder District',
    visitors: 850,
    avgTime: 35,
    engagement: 78,
    conversion: 4.1,
    topActivities: ['Shop browsing', 'Citizen interactions', 'Event participation']
  },
  {
    name: 'Creative Commons',
    visitors: 620,
    avgTime: 48,
    engagement: 85,
    conversion: 2.8,
    topActivities: ['Art creation', 'Collaboration', 'Showcase viewing']
  },
  {
    name: 'Tech Hub',
    visitors: 280,
    avgTime: 25,
    engagement: 65,
    conversion: 1.9,
    topActivities: ['Demo viewing', 'Networking', 'Product exploration']
  }
];

const mockUserSegments: UserSegment[] = [
  {
    name: 'Explorers',
    count: 450,
    percentage: 36,
    avgSessionTime: 55,
    avgInteractions: 35,
    characteristics: ['High movement', 'Multiple districts', 'Social interactions']
  },
  {
    name: 'Shoppers',
    count: 380,
    percentage: 30,
    avgSessionTime: 40,
    avgInteractions: 28,
    characteristics: ['Purchase focused', 'Shop visits', 'Product research']
  },
  {
    name: 'Creators',
    count: 250,
    percentage: 20,
    avgSessionTime: 65,
    avgInteractions: 42,
    characteristics: ['Content creation', 'Collaboration', 'Showcase participation']
  },
  {
    name: 'Socializers',
    count: 170,
    percentage: 14,
    avgSessionTime: 35,
    avgInteractions: 45,
    characteristics: ['Chat heavy', 'Group activities', 'Event attendance']
  }
];

export function UserAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />;
      case 'down': return <TrendingUp className="w-4 h-4 rotate-180" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">User Analytics</h3>
          <p className="text-sm text-gray-600">3D space user interactions and engagement insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {(['1h', '24h', '7d', '30d'] as const).map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe)}
              >
                {timeframe}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {mockEngagementMetrics.map((metric) => (
          <Card key={metric.metric}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="text-blue-600">{metric.icon}</div>
                  <div>
                    <p className="text-2xl font-bold">
                      {metric.metric.includes('Rate') ? `${metric.value}%` :
                       metric.metric.includes('Time') ? `${metric.value}m` :
                       metric.value.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">{metric.metric}</p>
                  </div>
                </div>
                <div className={`flex items-center space-x-1 ${getTrendColor(metric.trend)}`}>
                  {getTrendIcon(metric.trend)}
                  <span className="text-sm font-medium">
                    {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="districts">District Analytics</TabsTrigger>
          <TabsTrigger value="segments">User Segments</TabsTrigger>
          <TabsTrigger value="sessions">Live Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Journey Heatmap Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>User Journey Heatmap</CardTitle>
                <CardDescription>Popular movement patterns in 3D space</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">3D heatmap visualization</p>
                    <p className="text-sm text-gray-500">Interactive 3D space would be rendered here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interaction Types */}
            <Card>
              <CardHeader>
                <CardTitle>Interaction Breakdown</CardTitle>
                <CardDescription>Types of user interactions in the space</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Chat Messages</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">8,450</span>
                      <Progress value={68} className="w-16" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Shop Views</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">5,230</span>
                      <Progress value={42} className="w-16" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-red-600" />
                      <span className="text-sm">Likes/Favorites</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">2,890</span>
                      <Progress value={23} className="w-16" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Purchases</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">1,120</span>
                      <Progress value={9} className="w-16" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Content */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <CardDescription>Most engaging shops and experiences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Memory Bazaar', views: 2840, engagement: 92, revenue: 1250 },
                  { name: 'Art Gallery Alpha', views: 1920, engagement: 88, revenue: 890 },
                  { name: 'Tech Demo Hub', views: 1650, engagement: 85, revenue: 650 },
                  { name: 'Creative Studio', views: 1430, engagement: 82, revenue: 420 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.views} views</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{item.engagement}% engagement</Badge>
                        <span className="text-sm font-medium">${item.revenue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="districts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockDistrictAnalytics.map((district) => (
              <Card key={district.name}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Map className="w-5 h-5" />
                    <span>{district.name}</span>
                  </CardTitle>
                  <CardDescription>District performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Visitors:</span>
                      <div className="font-medium">{district.visitors.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg Time:</span>
                      <div className="font-medium">{district.avgTime}min</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Engagement:</span>
                      <div className="font-medium">{district.engagement}%</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Conversion:</span>
                      <div className="font-medium">{district.conversion}%</div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Top Activities</h5>
                    <div className="flex flex-wrap gap-1">
                      {district.topActivities.map((activity) => (
                        <Badge key={activity} variant="outline" className="text-xs">
                          {activity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="space-y-4">
            {mockUserSegments.map((segment) => (
              <Card key={segment.name}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">{segment.name}</h4>
                        <Badge variant="outline">{segment.percentage}% of users</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Users:</span>
                          <div className="font-medium">{segment.count.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Avg Session:</span>
                          <div className="font-medium">{segment.avgSessionTime}min</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Interactions:</span>
                          <div className="font-medium">{segment.avgInteractions}</div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2">Characteristics</h5>
                        <div className="flex flex-wrap gap-1">
                          {segment.characteristics.map((char) => (
                            <Badge key={char} variant="secondary" className="text-xs">
                              {char}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">
                      <div className="w-16 h-16 relative">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="2"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeDasharray={`${segment.percentage}, 100`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium">{segment.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Sessions List */}
            <div className="space-y-4">
              {mockSessions.map((session) => (
                <Card
                  key={session.id}
                  className={`cursor-pointer transition-all ${
                    selectedSession?.id === session.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedSession(session)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Users className="w-4 h-4" />
                          <h4 className="font-medium">{session.userName}</h4>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Active
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          Session: {session.duration}min • {session.interactions} interactions
                        </p>

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Districts: {session.districtsVisited.join(', ')}</span>
                          <span>Purchases: {session.purchases}</span>
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        Follow
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Session Details */}
            <div>
              {selectedSession ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Session Details</CardTitle>
                    <CardDescription>{selectedSession.userName}'s current session</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Start Time:</span>
                        <div className="font-medium">
                          {new Date(selectedSession.startTime).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <div className="font-medium">{selectedSession.duration} minutes</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Interactions:</span>
                        <div className="font-medium">{selectedSession.interactions}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Purchases:</span>
                        <div className="font-medium">{selectedSession.purchases}</div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">District Path</h5>
                      <div className="space-y-2">
                        {selectedSession.districtsVisited.map((district, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <span className="text-sm">{district}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Movement Path</h5>
                      <div className="text-xs text-gray-600">
                        {selectedSession.path.length} waypoints recorded
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Session</h3>
                    <p className="text-gray-600">
                      Choose a live session to view detailed activity and movement
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}</content>
<parameter name="filePath">c:\Users\cupca\Documents\ai-mall\components\3d\admin\UserAnalytics.tsx