'use client';

import { useState, useEffect } from 'react';
import { Users, Gift, Copy, Share2, Mail, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Referral = {
  id: string;
  referred_email: string;
  status: 'pending' | 'registered' | 'completed' | 'expired';
  bonus_points: number;
  bonus_awarded: boolean;
  created_at: string;
  completed_at?: string;
  expires_at: string;
};

export default function ReferralDashboard() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [newReferralEmail, setNewReferralEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalBonusEarned: 0
  });

  useEffect(() => {
    if (user) {
      fetchReferralData();
      generateReferralCode();
    }
  }, [user]);

  const generateReferralCode = () => {
    if (user) {
      // Create a simple referral code based on user ID
      const code = `REF${user.id.slice(0, 8).toUpperCase()}`;
      setReferralCode(code);
    }
  };

  const fetchReferralData = async () => {
    try {
      const { data: referralsData } = await supabase
        .from('loyalty_referrals')
        .select('*')
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false });

      if (referralsData) {
        setReferrals(referralsData);

        // Calculate stats
        const total = referralsData.length;
        const completed = referralsData.filter(r => r.status === 'completed').length;
        const pending = referralsData.filter(r => r.status === 'pending').length;
        const bonusEarned = referralsData
          .filter(r => r.bonus_awarded)
          .reduce((sum, r) => sum + r.bonus_points, 0);

        setStats({
          totalReferrals: total,
          completedReferrals: completed,
          pendingReferrals: pending,
          totalBonusEarned: bonusEarned
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      setLoading(false);
    }
  };

  const createReferral = async () => {
    if (!newReferralEmail || !user) return;

    try {
      const { data, error } = await supabase
        .from('loyalty_referrals')
        .insert({
          referrer_id: user.id,
          referred_email: newReferralEmail,
          referral_code: referralCode
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Referral invitation sent!');
      setNewReferralEmail('');
      fetchReferralData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create referral');
    }
  };

  const copyReferralLink = () => {
    if (typeof window === 'undefined') return;
    const referralUrl = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(referralUrl);
    toast.success('Referral link copied to clipboard!');
  };

  const shareReferral = () => {
    if (typeof window === 'undefined') return;
    const referralUrl = `${window.location.origin}/register?ref=${referralCode}`;
    const text = `Join me on the AI Mall and get bonus loyalty points! Use my referral code: ${referralUrl}`;

    if (navigator.share) {
      navigator.share({
        title: 'Join AI Mall',
        text: text,
        url: referralUrl
      });
    } else {
      copyReferralLink();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Sign in to access your referral dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                <p className="text-sm text-gray-600">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.completedReferrals}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pendingReferrals}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gift className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalBonusEarned}</p>
                <p className="text-sm text-gray-600">Bonus Points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Your Referral Link</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              value={typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${referralCode}` : ''}
              readOnly
              className="flex-1"
            />
            <Button onClick={copyReferralLink} variant="outline">
              <Copy className="w-4 h-4" />
            </Button>
            <Button onClick={shareReferral}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Share this link with friends. When they sign up and make their first purchase, you'll both earn 500 bonus points!
          </p>
        </CardContent>
      </Card>

      {/* Invite by Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Invite by Email</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              type="email"
              placeholder="friend@example.com"
              value={newReferralEmail}
              onChange={(e) => setNewReferralEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={createReferral} disabled={!newReferralEmail}>
              Send Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No referrals yet</p>
              <p className="text-sm">Start inviting friends to earn bonus points!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(referral.status)}
                    <div>
                      <p className="font-medium">{referral.referred_email}</p>
                      <p className="text-sm text-gray-600">
                        Invited {new Date(referral.created_at).toLocaleDateString()}
                        {referral.completed_at && ` • Completed ${new Date(referral.completed_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(referral.status)}>
                      {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                    </Badge>
                    {referral.bonus_awarded && (
                      <Badge variant="secondary">
                        +{referral.bonus_points} pts
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}