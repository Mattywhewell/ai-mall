'use client';

import { useState, useEffect } from 'react';
import { Star, Gift, Award, TrendingUp, ShoppingBag, Calendar, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

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

type Reward = {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  reward_type: string;
  reward_value: any;
  image_url: string;
  is_active: boolean;
};

export default function LoyaltyProgramPage() {
  const { user } = useAuth();
  const [userLoyalty, setUserLoyalty] = useState<UserLoyalty | null>(null);
  const [currentTier, setCurrentTier] = useState<Tier | null>(null);
  const [allTiers, setAllTiers] = useState<Tier[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLoyaltyData();
    }
  }, [user]);

  const fetchLoyaltyData = async () => {
    try {
      // Fetch tiers
      const { data: tiersData } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .order('min_points', { ascending: true });
      
      if (tiersData) setAllTiers(tiersData);

      // Fetch user loyalty points
      let { data: loyaltyData } = await supabase
        .from('user_loyalty_points')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      // Create if doesn't exist
      if (!loyaltyData && user) {
        const { data: newLoyalty } = await supabase
          .from('user_loyalty_points')
          .insert({
            user_id: user.id,
            total_points: 0,
            available_points: 0,
            tier_id: tiersData?.[0]?.id,
          })
          .select()
          .single();
        loyaltyData = newLoyalty;
      }

      if (loyaltyData) {
        setUserLoyalty(loyaltyData);
        
        // Find current tier
        const tier = tiersData?.find(t => t.id === loyaltyData.tier_id);
        setCurrentTier(tier || null);
      }

      // Fetch rewards
      const { data: rewardsData } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_cost', { ascending: true });
      
      if (rewardsData) setRewards(rewardsData);

      // Fetch recent transactions
      const { data: transactionsData } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (transactionsData) setTransactions(transactionsData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
      setLoading(false);
    }
  };

  const getNextTier = () => {
    if (!currentTier || !allTiers.length) return null;
    const currentIndex = allTiers.findIndex(t => t.id === currentTier.id);
    return currentIndex < allTiers.length - 1 ? allTiers[currentIndex + 1] : null;
  };

  const getProgressToNextTier = () => {
    const nextTier = getNextTier();
    if (!nextTier || !userLoyalty) return 100;
    
    const current = userLoyalty.total_points;
    const start = currentTier?.min_points || 0;
    const end = nextTier.min_points;
    
    return Math.min(((current - start) / (end - start)) * 100, 100);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Award className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Join Our Loyalty Program</h2>
          <p className="text-gray-600 mb-6">Sign in to start earning rewards!</p>
          <Link
            href="/login"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-block"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your rewards...</p>
        </div>
      </div>
    );
  }

  const nextTier = getNextTier();
  const progress = getProgressToNextTier();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Aiverse Rewards
            </h1>
            <Sparkles className="w-8 h-8 text-pink-600" />
          </div>
          <p className="text-gray-600 text-lg">Earn points with every purchase and unlock exclusive rewards</p>
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2" style={{ borderColor: currentTier?.badge_color || '#9333ea' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${currentTier?.badge_color}20` }}>
                <Crown className="w-8 h-8" style={{ color: currentTier?.badge_color }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{currentTier?.name} Member</h2>
                <p className="text-gray-600">{currentTier?.multiplier}x points multiplier</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-purple-600">{userLoyalty?.available_points || 0}</div>
              <div className="text-gray-600">Available Points</div>
            </div>
          </div>

          {nextTier && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Progress to {nextTier.name}</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {nextTier.min_points - (userLoyalty?.total_points || 0)} points to {nextTier.name}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Stats & Benefits */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                Your Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Points Earned</span>
                  <span className="font-bold text-purple-600">{userLoyalty?.total_points || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Lifetime Spent</span>
                  <span className="font-bold">${userLoyalty?.lifetime_spent?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Multiplier</span>
                  <span className="font-bold text-green-600">{currentTier?.multiplier}x</span>
                </div>
              </div>
            </div>

            {/* Current Benefits */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-purple-600" />
                Your Benefits
              </h3>
              <div className="space-y-3">
                {currentTier?.benefits.free_shipping && (
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                    <span className="text-sm text-gray-700">
                      {currentTier.benefits.free_shipping === true
                        ? 'Free shipping on all orders'
                        : `Free shipping over $${currentTier.benefits.free_shipping_threshold}`}
                    </span>
                  </div>
                )}
                {currentTier?.benefits.birthday_bonus && (
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                    <span className="text-sm text-gray-700">
                      {currentTier.benefits.birthday_bonus} birthday bonus points
                    </span>
                  </div>
                )}
                {currentTier?.benefits.early_access && (
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                    <span className="text-sm text-gray-700">Early access to new products</span>
                  </div>
                )}
                {currentTier?.benefits.priority_support && (
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                    <span className="text-sm text-gray-700">Priority customer support</span>
                  </div>
                )}
                {currentTier?.benefits.exclusive_deals && (
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                    <span className="text-sm text-gray-700">Exclusive deals and promotions</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Rewards & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rewards Catalog */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <Gift className="w-6 h-6 mr-2 text-purple-600" />
                Redeem Rewards
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="border-2 border-gray-200 rounded-xl p-4 hover:border-purple-500 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900">{reward.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold text-purple-600">{reward.points_cost} pts</span>
                      </div>
                      <button
                        disabled={(userLoyalty?.available_points || 0) < reward.points_cost}
                        className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Redeem
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-purple-600" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'earn' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'earn' ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold ${
                        transaction.type === 'earn' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'earn' ? '+' : '-'}{Math.abs(transaction.points)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No activity yet. Start shopping to earn points!</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* All Tiers */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-6 text-center">Membership Tiers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {allTiers.map((tier, index) => (
              <div
                key={tier.id}
                className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
                  tier.id === currentTier?.id ? 'border-purple-500 ring-4 ring-purple-200' : 'border-gray-200'
                }`}
              >
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${tier.badge_color}20` }}
                  >
                    <Crown className="w-8 h-8" style={{ color: tier.badge_color }} />
                  </div>
                  <h4 className="text-xl font-bold mb-2">{tier.name}</h4>
                  <p className="text-sm text-gray-600 mb-4">{tier.min_points}+ points</p>
                  <div className="text-2xl font-bold text-purple-600 mb-4">{tier.multiplier}x</div>
                  {tier.id === currentTier?.id && (
                    <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                      Current Tier
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to Earn */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">How to Earn Points</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-bold mb-2">Shop</h4>
              <p className="text-purple-100 text-sm">Earn 1 point per $1 spent</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8" />
              </div>
              <h4 className="font-bold mb-2">Review</h4>
              <p className="text-purple-100 text-sm">Get 50 points per product review</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8" />
              </div>
              <h4 className="font-bold mb-2">Refer Friends</h4>
              <p className="text-purple-100 text-sm">Earn 500 points per referral</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
