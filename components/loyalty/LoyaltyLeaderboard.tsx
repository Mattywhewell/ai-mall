'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Crown, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


type LeaderboardEntry = {
  id: string;
  user_id: string;
  total_points: number;
  tier_name: string;
  rank: number;
  period: 'all_time' | 'monthly' | 'weekly';
  calculated_at: string;
  user_email?: string;
  user_name?: string;
};

export default function LoyaltyLeaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<{
    all_time: LeaderboardEntry[];
    monthly: LeaderboardEntry[];
    weekly: LeaderboardEntry[];
  }>({
    all_time: [],
    monthly: [],
    weekly: []
  });
  const [userRank, setUserRank] = useState<{
    all_time?: number;
    monthly?: number;
    weekly?: number;
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Fetch all leaderboard data
      const { data: allTimeData } = await supabase
        .from('loyalty_leaderboard')
        .select(`
          *,
          auth.users!inner(email)
        `)
        .eq('period', 'all_time')
        .order('rank', { ascending: true });

      const { data: monthlyData } = await supabase
        .from('loyalty_leaderboard')
        .select(`
          *,
          auth.users!inner(email)
        `)
        .eq('period', 'monthly')
        .order('rank', { ascending: true });

      const { data: weeklyData } = await supabase
        .from('loyalty_leaderboard')
        .select(`
          *,
          auth.users!inner(email)
        `)
        .eq('period', 'weekly')
        .order('rank', { ascending: true });

      // Process data to include user info, handle nulls and parser errors
      const processData = (data: unknown[] | null) => {
        if (!Array.isArray(data)) return [];
        return data
          .filter(entry => entry && typeof entry === 'object' && !('message' in entry))
          .map(entry => ({
            ...entry,
            user_email: entry.users?.email,
            user_name: entry.users?.email?.split('@')[0] || 'Anonymous'
          }));
      };

      const processedAllTime = processData(allTimeData);
      const processedMonthly = processData(monthlyData);
      const processedWeekly = processData(weeklyData);

      setLeaderboard({
        all_time: processedAllTime,
        monthly: processedMonthly,
        weekly: processedWeekly
      });

      // Find user's rank
      if (user) {
        const userRanks = {
          all_time: processedAllTime.find(entry => entry.user_id === user.id)?.rank,
          monthly: processedMonthly.find(entry => entry.user_id === user.id)?.rank,
          weekly: processedWeekly.find(entry => entry.user_id === user.id)?.rank
        };
        setUserRank(userRanks);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 2:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 3:
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const renderLeaderboard = (entries: LeaderboardEntry[]) => {
    if (entries.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No leaderboard data yet</p>
          <p className="text-sm">Start earning points to appear on the leaderboard!</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {entries.map((entry) => {
          const isCurrentUser = user && entry.user_id === user.id;

          return (
            <div
              key={`${entry.period}-${entry.user_id}`}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                isCurrentUser
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getRankIcon(entry.rank)}
                  <Badge className={getRankBadgeColor(entry.rank)}>
                    #{entry.rank}
                  </Badge>
                </div>

                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    {entry.user_name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className={`font-medium ${isCurrentUser ? 'text-purple-900' : ''}`}>
                    {entry.user_name}
                    {isCurrentUser && <span className="text-purple-600 ml-2">(You)</span>}
                  </p>
                  <p className="text-sm text-gray-600">{entry.tier_name} Tier</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">
                  {entry.total_points.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">points</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Rank Summary */}
      {user && (userRank.all_time || userRank.monthly || userRank.weekly) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Your Rankings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userRank.all_time && (
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    {getRankIcon(userRank.all_time)}
                  </div>
                  <p className="text-2xl font-bold text-purple-900">#{userRank.all_time}</p>
                  <p className="text-sm text-purple-700">All Time</p>
                </div>
              )}

              {userRank.monthly && (
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    {getRankIcon(userRank.monthly)}
                  </div>
                  <p className="text-2xl font-bold text-blue-900">#{userRank.monthly}</p>
                  <p className="text-sm text-blue-700">This Month</p>
                </div>
              )}

              {userRank.weekly && (
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    {getRankIcon(userRank.weekly)}
                  </div>
                  <p className="text-2xl font-bold text-green-900">#{userRank.weekly}</p>
                  <p className="text-sm text-green-700">This Week</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span>Loyalty Leaderboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all_time" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all_time">All Time</TabsTrigger>
              <TabsTrigger value="monthly">This Month</TabsTrigger>
              <TabsTrigger value="weekly">This Week</TabsTrigger>
            </TabsList>

            <TabsContent value="all_time" className="mt-6">
              {renderLeaderboard(leaderboard.all_time)}
            </TabsContent>

            <TabsContent value="monthly" className="mt-6">
              {renderLeaderboard(leaderboard.monthly)}
            </TabsContent>

            <TabsContent value="weekly" className="mt-6">
              {renderLeaderboard(leaderboard.weekly)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* How Rankings Work */}
      <Card>
        <CardHeader>
          <CardTitle>How Rankings Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>All Time:</strong> Rankings based on total lifetime points earned
            </p>
            <p>
              <strong>This Month:</strong> Rankings based on points earned in the current month
            </p>
            <p>
              <strong>This Week:</strong> Rankings based on points earned in the current week
            </p>
            <p className="pt-2 text-xs">
              Leaderboards update daily. Keep earning points to climb the ranks!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}