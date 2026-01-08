/**
 * Social Dynamics System
 * Creates emergent social experiences and collaborative discovery
 */

export interface SocialPresence {
  userId: string;
  location: string;
  activity: 'browsing' | 'purchasing' | 'conversing' | 'idle';
  publicProfile: {
    displayName: string;
    avatar?: string;
    interests: string[];
    style: string;
  };
  lastSeen: Date;
}

export interface CollaborativeSession {
  id: string;
  participants: string[];
  sessionType: 'co_browse' | 'gift_together' | 'explore_together';
  sharedCart?: any[];
  chatHistory: any[];
  createdAt: Date;
}

/**
 * Detect potential connections between users
 */
export function detectPotentialConnections(
  user: SocialPresence,
  nearbyUsers: SocialPresence[]
): Array<{ user: SocialPresence; compatibility: number; reason: string }> {
  return nearbyUsers
    .map(otherUser => {
      if (otherUser.userId === user.userId) return null;
      
      const sharedInterests = user.publicProfile.interests.filter(i =>
        otherUser.publicProfile.interests.includes(i)
      );
      
      const compatibility = sharedInterests.length / Math.max(
        user.publicProfile.interests.length,
        otherUser.publicProfile.interests.length
      );
      
      const reason = sharedInterests.length > 0
        ? `You both love ${sharedInterests.slice(0, 2).join(' and ')}`
        : `You're both exploring ${user.location}`;
      
      return { user: otherUser, compatibility, reason };
    })
    .filter(Boolean)
    .filter(c => c!.compatibility > 0.3)
    .sort((a, b) => b!.compatibility - a!.compatibility) as any;
}

/**
 * Generate ambient social notifications
 */
export function generateAmbientSocialNotification(
  location: string,
  userCount: number,
  recentActivity: any[]
): string | null {
  if (userCount > 10) {
    return `${userCount} souls are exploring ${location} right now`;
  }
  
  if (recentActivity.length > 3) {
    return `3 people just discovered something special here`;
  }
  
  if (userCount === 2) {
    return `Another traveler is wandering nearby`;
  }
  
  return null;
}

/**
 * Create collaborative shopping session
 */
export async function createCollaborativeSession(
  initiatorId: string,
  invitedUserIds: string[],
  sessionType: CollaborativeSession['sessionType']
): Promise<CollaborativeSession> {
  return {
    id: `collab_${Date.now()}`,
    participants: [initiatorId, ...invitedUserIds],
    sessionType,
    sharedCart: [],
    chatHistory: [],
    createdAt: new Date(),
  };
}

/**
 * Ghost presence system - leave traces for future visitors
 */
export interface GhostPresence {
  userId: string;
  location: string;
  action: string; // "admired this piece", "contemplated here", "found joy in this"
  emotion: string;
  timestamp: Date;
  fadeDuration: number; // How long this presence lingers (hours)
}

export function createGhostPresence(
  userId: string,
  location: string,
  action: string,
  emotion: string
): GhostPresence {
  return {
    userId,
    location,
    action,
    emotion,
    timestamp: new Date(),
    fadeDuration: 24, // Lasts 24 hours
  };
}

/**
 * Show ghost presences to current visitor
 */
export function getActiveGhostPresences(
  location: string,
  currentTime: Date
): GhostPresence[] {
  // This would query from database
  // For now, return structure
  return [];
}

/**
 * Community gifting system
 */
export interface CommunityGift {
  id: string;
  giftedBy: string;
  giftedTo: 'random_visitor' | 'next_visitor' | 'specific_user';
  specificUserId?: string;
  item: any;
  message: string;
  claimed: boolean;
  claimedBy?: string;
  claimedAt?: Date;
  expiresAt: Date;
}

export function createCommunityGift(
  fromUserId: string,
  item: any,
  message: string,
  giftType: CommunityGift['giftedTo']
): CommunityGift {
  return {
    id: `gift_${Date.now()}`,
    giftedBy: fromUserId,
    giftedTo: giftType,
    item,
    message,
    claimed: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  };
}

/**
 * Collective energy system - spaces get energy from visitor interactions
 */
export interface CollectiveEnergy {
  location: string;
  energy_level: number; // 0-100
  dominant_emotion: string;
  contributor_count: number;
  peak_time: Date;
  energy_quality: 'vibrant' | 'peaceful' | 'mysterious' | 'creative' | 'chaotic';
}

export function calculateCollectiveEnergy(
  location: string,
  recentVisitors: Array<{ emotion: string; timeSpent: number }>
): CollectiveEnergy {
  const emotionCounts: Record<string, number> = {};
  let totalEnergy = 0;
  
  recentVisitors.forEach(visitor => {
    emotionCounts[visitor.emotion] = (emotionCounts[visitor.emotion] || 0) + 1;
    totalEnergy += visitor.timeSpent / 60; // Convert to minutes
  });
  
  const dominantEmotion = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'curious';
  
  const energyLevel = Math.min(100, totalEnergy / recentVisitors.length * 10);
  
  let quality: CollectiveEnergy['energy_quality'] = 'vibrant';
  if (dominantEmotion === 'calm' || dominantEmotion === 'contemplation') {
    quality = 'peaceful';
  } else if (dominantEmotion === 'curiosity') {
    quality = 'mysterious';
  } else if (dominantEmotion === 'joy') {
    quality = 'creative';
  }
  
  return {
    location,
    energy_level: energyLevel,
    dominant_emotion: dominantEmotion,
    contributor_count: recentVisitors.length,
    peak_time: new Date(),
    energy_quality: quality,
  };
}
