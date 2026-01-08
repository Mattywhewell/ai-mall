/**
 * World Architecture Types
 * Defines the layered structure of the AI City
 */

export interface Hall {
  id: string;
  name: string;
  slug: string;
  theme: 'innovation' | 'wellness' | 'craft' | 'motion' | 'light';
  atmosphere: HallAtmosphere;
  ai_spirit: AISpirit;
  connected_streets: string[];
  created_at: string;
  updated_at: string;
}

export interface HallAtmosphere {
  mood: string;
  color_palette: string[];
  ambient_text: string;
  sound_theme?: string;
  lighting_style: 'bright' | 'dim' | 'neon' | 'warm' | 'cool';
  time_of_day_adaptation: boolean;
}

export interface Chapel {
  id: string;
  name: string;
  slug: string;
  emotion: 'contemplation' | 'joy' | 'mystery' | 'serenity' | 'wonder';
  micro_story: string;
  ritual?: string;
  ai_insight: string;
  symbolism: string[];
  connected_to_hall?: string;
  user_adapted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Street {
  id: string;
  name: string;
  slug: string;
  personality: 'neon' | 'artisan' | 'wellness' | 'tech' | 'vintage';
  connects_hall: string;
  districts: string[];
  popularity_score: number;
  trending: boolean;
  dynamic_order: boolean;
  atmosphere_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface AISpirit {
  name: string;
  voice_style: 'philosophical' | 'energetic' | 'calm' | 'playful' | 'mysterious';
  greeting: string;
  insights: string[];
  personality_traits: string[];
  interaction_style: string;
}

export interface WorldLayer {
  halls: Hall[];
  chapels: Chapel[];
  streets: Street[];
  districts: any[]; // Existing microstores
}

export interface UserWorldView {
  user_id: string;
  preferred_halls: string[];
  visited_chapels: string[];
  street_affinity: Record<string, number>;
  district_preferences: Record<string, number>;
  personalized_order: {
    halls: string[];
    streets: string[];
    districts: string[];
  };
  atmosphere_preference: 'bright' | 'cozy' | 'minimal' | 'vibrant';
  last_updated: string;
}

export interface WorldAnalytics {
  hall_popularity: Record<string, number>;
  chapel_visits: Record<string, number>;
  street_traffic: Record<string, number>;
  district_engagement: Record<string, number>;
  peak_hours: string[];
  conversion_by_layer: {
    halls: Record<string, number>;
    streets: Record<string, number>;
    districts: Record<string, number>;
  };
}
