'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserAvatarUpload from '@/components/user/UserAvatarUpload';
import { Eye, Star, MapPin } from 'lucide-react';

export default function AvatarPage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      // This would fetch user profile data including avatar status
      const response = await fetch('/api/user/avatar');
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
      }}>
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4"
               style={{ borderColor: '#c0c0c0', borderTopColor: 'transparent' }}></div>
          <p style={{ color: '#c0c0c0' }}>The fog parts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      fontFamily: 'Mythos Sans, system-ui, sans-serif'
    }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#ffd700' }}>
            Your Reflection
          </h1>
          <p className="text-xl opacity-80" style={{ color: '#f0f0f0' }}>
            Shape your presence in the Aiverse
          </p>
        </div>

        {/* Avatar Upload Component */}
        <UserAvatarUpload />

        {/* Additional Profile Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Citizen Status */}
          <div className="bg-opacity-10 rounded-lg p-6 text-center" style={{
            background: 'rgba(192, 192, 192, 0.1)',
            border: '1px solid #c0c0c0'
          }}>
            <Star className="w-8 h-8 mx-auto mb-3" style={{ color: '#ffd700' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#c0c0c0' }}>
              Citizen Status
            </h3>
            <p className="text-sm opacity-70" style={{ color: '#f0f0f0' }}>
              Wanderer • Level 1
            </p>
          </div>

          {/* District */}
          <div className="bg-opacity-10 rounded-lg p-6 text-center" style={{
            background: 'rgba(192, 192, 192, 0.1)',
            border: '1px solid #c0c0c0'
          }}>
            <MapPin className="w-8 h-8 mx-auto mb-3" style={{ color: '#ffd700' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#c0c0c0' }}>
              Home District
            </h3>
            <p className="text-sm opacity-70" style={{ color: '#f0f0f0' }}>
              Central Plaza
            </p>
          </div>

          {/* Achievements */}
          <div className="bg-opacity-10 rounded-lg p-6 text-center" style={{
            background: 'rgba(192, 192, 192, 0.1)',
            border: '1px solid #c0c0c0'
          }}>
            <Eye className="w-8 h-8 mx-auto mb-3" style={{ color: '#ffd700' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#c0c0c0' }}>
              Rituals Completed
            </h3>
            <p className="text-sm opacity-70" style={{ color: '#f0f0f0' }}>
              Arrival • Awakening
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 text-center">
          <button
            onClick={() => router.push('/profile')}
            className="px-6 py-3 rounded-lg font-semibold mr-4"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: '1px solid #c0c0c0',
              color: '#c0c0c0'
            }}
          >
            Back to Profile
          </button>
          <button
            onClick={() => router.push('/districts')}
            className="px-6 py-3 rounded-lg font-semibold"
            style={{
              background: 'linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%)',
              border: '1px solid #ffd700',
              color: '#ffd700'
            }}
          >
            Explore Districts
          </button>
        </div>
      </div>
    </div>
  );
}