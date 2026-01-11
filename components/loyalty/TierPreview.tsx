'use client';

import { useState, useEffect } from 'react';
import { Crown, TrendingUp, Star, Truck, Headphones, Gift, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Tier = {
  id: string;
  name: string;
  min_points: number;
  multiplier: number;
  benefits: any;
  badge_color: string;
};

type UserLoyalty = {
  total_points: number;
  available_points: number;
  lifetime_spent: number;
  tier_id: string;
};

const Progress = ({ value, className = '' }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded ${className}`} style={{ height: '0.5rem' }}>
    <div
      className="bg-purple-500 h-full rounded"
      style={{ width: `${value}%`, transition: 'width 0.3s' }}
    />
  </div>
);

export default function TierPreview() {
  const { user } = useAuth();
  const [userLoyalty, setUserLoyalty] = useState<UserLoyalty | null>(null);
  const [allTiers, setAllTiers] = useState<Tier[]>([]);
  const [currentTier, setCurrentTier] = useState<Tier | null>(null);
  const [nextTier, setNextTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTierData();
    }
  }, [user]);

  const fetchTierData = async () => {
    try {
      // Fetch all tiers
      const { data: tiersData } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .order('min_points', { ascending: true });

      if (tiersData) {
        setAllTiers(tiersData);
      }

      // Fetch user loyalty
      const { data: loyaltyData } = await supabase
        .from('user_loyalty_points')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (loyaltyData) {
        setUserLoyalty(loyaltyData);

        // Find current tier
        const current = tiersData?.find(t => t.id === loyaltyData.tier_id);
        setCurrentTier(current || null);

        // Find next tier
        if (current && tiersData) {
          const currentIndex = tiersData.findIndex(t => t.id === current.id);
          if (currentIndex !== -1 && currentIndex < tiersData.length - 1) {
            setNextTier(tiersData[currentIndex + 1]);
          }
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching tier data:', error);
      setLoading(false);
    }
  };

  const getProgressToNextTier = () => {
    if (!nextTier || !userLoyalty || !currentTier) return 0;

    const current = userLoyalty.total_points;
    const start = currentTier.min_points;
    const end = nextTier.min_points;

    return Math.min(((current - start) / (end - start)) * 100, 100);
  };

  const getPointsToNextTier = () => {
    if (!nextTier || !userLoyalty) return 0;
    return Math.max(0, nextTier.min_points - userLoyalty.total_points);
  };

  const renderBenefitIcon = (benefit: string) => {
    switch (benefit) {
      case 'free_shipping':
        return <Truck className="w-4 h-4" />;
      case 'priority_support':
        return <Headphones className="w-4 h-4" />;
      case 'early_access':
        return <Zap className="w-4 h-4" />;
      case 'birthday_bonus':
        return <Gift className="w-4 h-4" />;
      case 'exclusive_deals':
        return <Star className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const renderBenefitText = (benefit: string, value: any) => {
    switch (benefit) {
      case 'free_shipping':
        return value === true ? 'Free shipping on all orders' : `Free shipping over $${value}`;
      case 'free_shipping_threshold':
        return `Free shipping over $${value}`;
      case 'birthday_bonus':
        return `${value} bonus points on your birthday`;
      case 'early_access':
        return 'Early access to sales and new products';
      case 'priority_support':
        return 'Priority customer support';
      case 'exclusive_deals':
        return 'Access to exclusive member deals';
      default:
        return benefit;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user || !currentTier) {
    return (
      <div className="text-center py-8">
        <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Sign in to view your tier progress</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Tier Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="w-5 h-5" style={{ color: currentTier.badge_color }} />
            <span>Current Tier: {currentTier.name}</span>
            <Badge style={{ backgroundColor: currentTier.badge_color, color: 'white' }}>
              {currentTier.multiplier}x Points
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress to {nextTier?.name || 'Max Tier'}</span>
                <span>{userLoyalty?.total_points || 0} / {nextTier?.min_points || userLoyalty?.total_points || 0} points</span>
              </div>
              {nextTier && (
                <Progress value={getProgressToNextTier()} className="h-2" />
              )}
            </div>

            {nextTier && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {getPointsToNextTier()} more points to reach {nextTier.name}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Tier Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5" />
            <span>{currentTier.name} Tier Benefits</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(currentTier.benefits).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {renderBenefitIcon(key)}
                <span className="text-sm">{renderBenefitText(key, value)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Tier Preview */}
      {nextTier && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Next Tier Preview: {nextTier.name}</span>
              <Badge variant="outline" className="text-blue-600">
                {nextTier.multiplier}x Points
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Reach {nextTier.min_points} points to unlock {nextTier.name} tier
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {getPointsToNextTier()} points to go
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-3">New Benefits You'll Unlock:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(nextTier.benefits).map(([key, value]) => {
                    const hasCurrentBenefit = currentTier.benefits[key];
                    const isUpgrade = !hasCurrentBenefit ||
                      (typeof value === 'number' && typeof currentTier.benefits[key] === 'number' &&
                       value > currentTier.benefits[key]);

                    if (!hasCurrentBenefit || isUpgrade) {
                      return (
                        <div key={key} className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          {renderBenefitIcon(key)}
                          <span className="text-sm text-green-800">
                            {renderBenefitText(key, value)}
                            {isUpgrade && <span className="text-xs block text-green-600">(Upgrade!)</span>}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Tiers Overview */}
      <Card>
        <CardHeader>
          <CardTitle>All Tiers Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allTiers.map((tier, index) => {
              const isCurrentTier = tier.id === currentTier.id;
              const isCompletedTier = (userLoyalty?.total_points || 0) >= tier.min_points;

              return (
                <div
                  key={tier.id}
                  className={`p-4 rounded-lg border-2 ${
                    isCurrentTier
                      ? 'border-purple-300 bg-purple-50'
                      : isCompletedTier
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Crown
                        className="w-5 h-5"
                        style={{ color: tier.badge_color }}
                      />
                      <span className="font-medium">{tier.name}</span>
                      <Badge variant="outline">
                        {tier.multiplier}x
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{tier.min_points} points</p>
                      {isCurrentTier && (
                        <p className="text-xs text-purple-600">Current Tier</p>
                      )}
                      {isCompletedTier && !isCurrentTier && (
                        <p className="text-xs text-green-600">Achieved</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                    {Object.entries(tier.benefits).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2 text-xs">
                        {renderBenefitIcon(key)}
                        <span className="truncate">{renderBenefitText(key, value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}