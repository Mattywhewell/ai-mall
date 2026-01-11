'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Calendar, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

type ExpiringPoints = {
  id: string;
  points: number;
  expires_at: string;
  source_transaction_id: string;
  notified: boolean;
};

export default function PointsExpirationWarnings() {
  const { user } = useAuth();
  const [expiringPoints, setExpiringPoints] = useState<ExpiringPoints[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchExpiringPoints();
    }
  }, [user]);

  const fetchExpiringPoints = async () => {
    try {
      const { data } = await supabase
        .from('loyalty_points_expiration')
        .select('*')
        .eq('user_id', user?.id)
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true })
        .limit(10);

      if (data) {
        setExpiringPoints(data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching expiring points:', error);
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 7) return 'text-red-600 bg-red-50 border-red-200';
    if (days <= 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getUrgencyIcon = (days: number) => {
    if (days <= 7) return <AlertTriangle className="w-4 h-4" />;
    if (days <= 30) return <Clock className="w-4 h-4" />;
    return <Calendar className="w-4 h-4" />;
  };

  const formatExpiryDate = (expiresAt: string) => {
    return new Date(expiresAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Show only points expiring within 90 days
  const urgentExpiringPoints = expiringPoints.filter(point => {
    const days = getDaysUntilExpiry(point.expires_at);
    return days <= 90;
  });

  if (urgentExpiringPoints.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-orange-800">
          <AlertTriangle className="w-5 h-5" />
          <span>Points Expiring Soon</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {urgentExpiringPoints.map((point) => {
            const days = getDaysUntilExpiry(point.expires_at);

            return (
              <Alert key={point.id} className={getUrgencyColor(days)}>
                <div className="flex items-center space-x-2">
                  {getUrgencyIcon(days)}
                  <AlertDescription className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{point.points} points</span>
                        <span className="text-sm ml-2">
                          expiring on {formatExpiryDate(point.expires_at)}
                        </span>
                      </div>
                      <Badge variant={days <= 7 ? "destructive" : days <= 30 ? "secondary" : "outline"}>
                        {days <= 0 ? 'Expired' : `${days} day${days === 1 ? '' : 's'}`}
                      </Badge>
                    </div>
                  </AlertDescription>
                </div>
              </Alert>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-white rounded-lg border">
          <p className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> Use your points before they expire! Shop now or redeem rewards to keep your points active.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}