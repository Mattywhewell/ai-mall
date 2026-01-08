/**
 * Memory Garden System
 * The city remembers and creates personalized experiences based on user history
 */

export interface UserMemory {
  userId: string;
  memoryType: 'visit' | 'purchase' | 'conversation' | 'emotion' | 'preference';
  content: any;
  location: string;
  emotionalWeight: number; // -1 to 1
  timestamp: Date;
  decayRate: number; // How fast this memory fades (0-1, lower = lasts longer)
}

export interface MemoryGarden {
  userId: string;
  coreMemories: UserMemory[]; // Never fade
  recentMemories: UserMemory[]; // Last 30 days
  fadingMemories: UserMemory[]; // Older, partially forgotten
  patterns: DiscoveredPattern[];
}

export interface DiscoveredPattern {
  patternType: 'preference' | 'behavior' | 'timing' | 'emotional';
  description: string;
  confidence: number; // 0-1
  examples: UserMemory[];
  discoveredAt: Date;
}

/**
 * Create a memory from user interaction
 */
export function createMemory(
  userId: string,
  memoryType: UserMemory['memoryType'],
  content: any,
  location: string,
  emotionalWeight: number = 0
): UserMemory {
  // Important memories decay slower
  const decayRate = Math.abs(emotionalWeight) > 0.7 ? 0.1 : 0.5;
  
  return {
    userId,
    memoryType,
    content,
    location,
    emotionalWeight,
    timestamp: new Date(),
    decayRate,
  };
}

/**
 * Calculate memory strength based on recency and emotional weight
 */
export function calculateMemoryStrength(memory: UserMemory): number {
  const now = Date.now();
  const age = (now - memory.timestamp.getTime()) / (1000 * 60 * 60 * 24); // Days
  
  // Exponential decay
  const timeFactor = Math.exp(-memory.decayRate * age);
  
  // Emotional memories are stronger
  const emotionalBoost = 1 + Math.abs(memory.emotionalWeight) * 0.5;
  
  return timeFactor * emotionalBoost;
}

/**
 * Discover patterns in user memories
 */
export function discoverPatterns(memories: UserMemory[]): DiscoveredPattern[] {
  const patterns: DiscoveredPattern[] = [];
  
  // Pattern 1: Time preference
  const timeVisits: Record<number, number> = {};
  memories.filter(m => m.memoryType === 'visit').forEach(m => {
    const hour = m.timestamp.getHours();
    timeVisits[hour] = (timeVisits[hour] || 0) + 1;
  });
  
  const preferredHour = Object.entries(timeVisits)
    .sort((a, b) => b[1] - a[1])[0];
  
  if (preferredHour && preferredHour[1] > 3) {
    patterns.push({
      patternType: 'timing',
      description: `Prefers visiting around ${preferredHour[0]}:00`,
      confidence: Math.min(1, preferredHour[1] / 10),
      examples: [],
      discoveredAt: new Date(),
    });
  }
  
  // Pattern 2: Location affinity
  const locationCounts: Record<string, number> = {};
  memories.forEach(m => {
    locationCounts[m.location] = (locationCounts[m.location] || 0) + 1;
  });
  
  const favoriteLocation = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])[0];
  
  if (favoriteLocation && favoriteLocation[1] > 5) {
    patterns.push({
      patternType: 'preference',
      description: `Drawn to ${favoriteLocation[0]}`,
      confidence: Math.min(1, favoriteLocation[1] / 20),
      examples: [],
      discoveredAt: new Date(),
    });
  }
  
  // Pattern 3: Emotional tendency
  const avgEmotion = memories.reduce((sum, m) => sum + m.emotionalWeight, 0) / memories.length;
  
  if (Math.abs(avgEmotion) > 0.3) {
    patterns.push({
      patternType: 'emotional',
      description: avgEmotion > 0 
        ? 'Tends toward joy and excitement'
        : 'Often seeks contemplation and calm',
      confidence: Math.abs(avgEmotion),
      examples: [],
      discoveredAt: new Date(),
    });
  }
  
  return patterns;
}

/**
 * Generate personalized greeting based on memory
 */
export function generatePersonalizedGreeting(garden: MemoryGarden): string {
  const recentVisits = garden.recentMemories.filter(m => m.memoryType === 'visit');
  
  if (recentVisits.length === 0) {
    return "Welcome, traveler. The city senses your first steps here.";
  }
  
  const lastVisit = recentVisits[recentVisits.length - 1];
  const daysSince = Math.floor((Date.now() - lastVisit.timestamp.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSince === 0) {
    return "Welcome back. I see you've returned to us already.";
  } else if (daysSince === 1) {
    return "Another day, another journey. The city remembers yesterday's footsteps.";
  } else if (daysSince < 7) {
    return `${daysSince} days since your last visit. We've been holding space for your return.`;
  } else if (daysSince < 30) {
    return `It's been a while. The city has evolved in your absence.`;
  } else {
    return `So much time has passed. Come, let me show you what's changed.`;
  }
}

/**
 * Recommend based on memory patterns
 */
export function getMemoryBasedRecommendations(garden: MemoryGarden): {
  products: any[];
  locations: string[];
  experiences: string[];
  reasoning: string;
} {
  const patterns = garden.patterns;
  
  // Find preference patterns
  const preferencePatterns = patterns.filter(p => p.patternType === 'preference');
  const emotionalPatterns = patterns.filter(p => p.patternType === 'emotional');
  
  let reasoning = "Based on your journey through our city, ";
  
  if (preferencePatterns.length > 0) {
    reasoning += `I notice you're drawn to ${preferencePatterns[0].description}. `;
  }
  
  if (emotionalPatterns.length > 0) {
    reasoning += emotionalPatterns[0].description + ". ";
  }
  
  reasoning += "Here's what might resonate with you today.";
  
  return {
    products: [],
    locations: preferencePatterns.map(p => p.description),
    experiences: [],
    reasoning,
  };
}

/**
 * Create core memory (never fades)
 */
export function createCoreMemory(
  userId: string,
  momentDescription: string,
  emotion: string,
  location: string
): UserMemory {
  return {
    userId,
    memoryType: 'emotion',
    content: { moment: momentDescription, emotion },
    location,
    emotionalWeight: 1.0,
    timestamp: new Date(),
    decayRate: 0, // Never fades
  };
}

/**
 * Surprise system - occasionally reference old memories
 */
export function shouldTriggerMemorySurprise(garden: MemoryGarden): UserMemory | null {
  const fadingMemories = garden.fadingMemories.filter(m => 
    calculateMemoryStrength(m) > 0.1 && calculateMemoryStrength(m) < 0.3
  );
  
  if (fadingMemories.length === 0) return null;
  
  // 10% chance to trigger
  if (Math.random() < 0.1) {
    return fadingMemories[Math.floor(Math.random() * fadingMemories.length)];
  }
  
  return null;
}
