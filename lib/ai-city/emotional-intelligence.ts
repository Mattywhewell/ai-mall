/**
 * Emotional Intelligence System
 * The AI City adapts to user emotions and creates empathetic experiences
 */

export interface EmotionalState {
  primary: 'joy' | 'calm' | 'curiosity' | 'contemplation' | 'excitement' | 'stress' | 'melancholy';
  intensity: number; // 0-1
  detected_from: 'behavior' | 'explicit' | 'inferred';
  timestamp: Date;
}

export interface EmotionalProfile {
  userId: string;
  currentState: EmotionalState;
  emotionalHistory: EmotionalState[];
  preferredEmotions: string[];
  triggers: {
    positive: string[];
    negative: string[];
  };
}

/**
 * Detect user emotion from behavior patterns
 */
export function detectEmotionFromBehavior(
  timeOnPage: number,
  clickRate: number,
  scrollSpeed: number,
  bounceRate: number,
  recentPurchases: any[]
): EmotionalState {
  // Fast scrolling + high bounce = stress/impatience
  if (scrollSpeed > 80 && bounceRate > 0.7) {
    return {
      primary: 'stress',
      intensity: 0.7,
      detected_from: 'behavior',
      timestamp: new Date(),
    };
  }
  
  // Slow browsing + low bounce = contemplation
  if (timeOnPage > 120 && bounceRate < 0.3) {
    return {
      primary: 'contemplation',
      intensity: 0.6,
      detected_from: 'behavior',
      timestamp: new Date(),
    };
  }
  
  // Recent purchases = joy/excitement
  if (recentPurchases.length > 0) {
    return {
      primary: 'joy',
      intensity: 0.8,
      detected_from: 'behavior',
      timestamp: new Date(),
    };
  }
  
  // Moderate activity = curiosity (default)
  return {
    primary: 'curiosity',
    intensity: 0.5,
    detected_from: 'behavior',
    timestamp: new Date(),
  };
}

/**
 * Adapt hall atmosphere to user emotion
 */
export function adaptAtmosphereToEmotion(
  baseAtmosphere: any,
  emotion: EmotionalState
): any {
  const adaptations: Record<string, any> = {
    stress: {
      lighting_style: 'soft',
      color_temperature: 'warm',
      pace: 'slow',
      music: 'ambient_calm',
      message: 'Take a breath. Everything here moves at your pace.',
    },
    melancholy: {
      lighting_style: 'gentle',
      color_temperature: 'warm',
      pace: 'contemplative',
      music: 'uplifting_gentle',
      message: 'You are welcome here, just as you are.',
    },
    joy: {
      lighting_style: 'bright',
      color_temperature: 'vibrant',
      pace: 'energetic',
      music: 'celebratory',
      message: 'Your energy illuminates this space!',
    },
    calm: {
      lighting_style: 'soft',
      color_temperature: 'neutral',
      pace: 'flowing',
      music: 'ambient_peace',
      message: 'Peace flows through these halls.',
    },
    curiosity: {
      lighting_style: 'dynamic',
      color_temperature: 'cool',
      pace: 'exploratory',
      music: 'mysterious_wonder',
      message: 'Every corner holds a new discovery.',
    },
    excitement: {
      lighting_style: 'bright',
      color_temperature: 'electric',
      pace: 'fast',
      music: 'energetic_pulse',
      message: 'The energy here matches yours perfectly!',
    },
    contemplation: {
      lighting_style: 'dim',
      color_temperature: 'warm',
      pace: 'meditative',
      music: 'reflective_quiet',
      message: 'This is a space for deep thought.',
    },
  };
  
  const adaptation = adaptations[emotion.primary] || adaptations.curiosity;
  
  return {
    ...baseAtmosphere,
    ...adaptation,
    adapted_for_emotion: emotion.primary,
    adaptation_intensity: emotion.intensity,
  };
}

/**
 * Recommend chapel based on emotional state
 */
export function recommendChapelForEmotion(emotion: EmotionalState): string[] {
  const recommendations: Record<string, string[]> = {
    stress: ['haven-serenity', 'quiet-thoughts'],
    melancholy: ['sanctuary-joy', 'haven-serenity'],
    joy: ['sanctuary-joy', 'alcove-wonder'],
    calm: ['haven-serenity', 'quiet-thoughts'],
    curiosity: ['alcove-wonder', 'chamber-mysteries'],
    excitement: ['sanctuary-joy', 'alcove-wonder'],
    contemplation: ['quiet-thoughts', 'chamber-mysteries'],
  };
  
  return recommendations[emotion.primary] || ['alcove-wonder'];
}

/**
 * Generate emotional support messages
 */
export function generateEmotionalMessage(emotion: EmotionalState): string {
  const messages: Record<string, string[]> = {
    stress: [
      "I sense heaviness. Let me show you to a place of rest.",
      "The world can wait. Here, you can simply be.",
      "Would you like to visit the Garden of Serenity?",
    ],
    melancholy: [
      "Sometimes we need beauty to remind us of light.",
      "Your presence here matters, even in quiet moments.",
      "Shall I guide you to something uplifting?",
    ],
    joy: [
      "Your light brightens every space you enter!",
      "This energy is contagious—others will feel it too.",
      "What would bring you even more delight?",
    ],
    curiosity: [
      "Your wonder is the key to infinite discoveries.",
      "Every question opens a new doorway here.",
      "Where shall your curiosity lead you next?",
    ],
  };
  
  const options = messages[emotion.primary] || messages.curiosity;
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Track emotional journey through the city
 */
export interface EmotionalJourney {
  userId: string;
  startEmotion: EmotionalState;
  endEmotion: EmotionalState;
  emotionalArc: EmotionalState[];
  locationsVisited: string[];
  emotionalTransformationScore: number; // -1 to 1 (negative to positive shift)
}

export function calculateEmotionalTransformation(journey: EmotionalJourney): number {
  const emotionalValues: Record<string, number> = {
    stress: -0.7,
    melancholy: -0.5,
    contemplation: 0.0,
    calm: 0.3,
    curiosity: 0.4,
    excitement: 0.6,
    joy: 0.8,
  };
  
  const startValue = emotionalValues[journey.startEmotion.primary] || 0;
  const endValue = emotionalValues[journey.endEmotion.primary] || 0;
  
  return endValue - startValue;
}
