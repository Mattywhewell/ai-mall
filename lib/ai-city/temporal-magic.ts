/**
 * Temporal Magic System
 * The city evolves through time - day/night cycles, seasons, moon phases, events
 */

export interface TemporalState {
  currentTime: Date;
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'evening' | 'night' | 'midnight';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  moonPhase: 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';
  specialEvent?: TemporalEvent;
}

export interface TemporalEvent {
  name: string;
  type: 'celestial' | 'seasonal' | 'cultural' | 'mysterious';
  startDate: Date;
  endDate: Date;
  effects: {
    atmosphereChanges: Record<string, any>;
    specialProducts: string[];
    spiritBehavior: string;
    rarityBoost: number; // 0-1, chance of rare items appearing
  };
}

/**
 * Get current temporal state
 */
export function getCurrentTemporalState(): TemporalState {
  const now = new Date();
  const hour = now.getHours();
  
  // Time of day
  let timeOfDay: TemporalState['timeOfDay'] = 'morning';
  if (hour >= 5 && hour < 7) timeOfDay = 'dawn';
  else if (hour >= 7 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 19) timeOfDay = 'dusk';
  else if (hour >= 19 && hour < 23) timeOfDay = 'evening';
  else if (hour >= 23 || hour < 2) timeOfDay = 'night';
  else timeOfDay = 'midnight';
  
  // Season
  const month = now.getMonth();
  let season: TemporalState['season'] = 'spring';
  if (month >= 2 && month < 5) season = 'spring';
  else if (month >= 5 && month < 8) season = 'summer';
  else if (month >= 8 && month < 11) season = 'autumn';
  else season = 'winter';
  
  // Moon phase (simplified)
  const moonPhase = calculateMoonPhase(now);
  
  // Check for special events
  const specialEvent = detectSpecialEvent(now);
  
  return { currentTime: now, timeOfDay, season, moonPhase, specialEvent };
}

function calculateMoonPhase(date: Date): TemporalState['moonPhase'] {
  // Simplified moon phase calculation
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  let c = 0, e = 0, jd = 0, b = 0;
  
  if (month < 3) {
    const yearOffset = year - 1;
    const monthOffset = month + 12;
  } else {
    const yearOffset = year;
    const monthOffset = month;
  }
  
  // Approximate calculation
  const phaseIndex = Math.floor((day % 30) / 3.75);
  const phases: TemporalState['moonPhase'][] = [
    'new', 'waxing_crescent', 'first_quarter', 'waxing_gibbous',
    'full', 'waning_gibbous', 'last_quarter', 'waning_crescent'
  ];
  
  return phases[phaseIndex] || 'new';
}

function detectSpecialEvent(date: Date): TemporalEvent | undefined {
  const month = date.getMonth();
  const day = date.getDate();
  
  // Winter Solstice (Dec 21)
  if (month === 11 && day >= 19 && day <= 23) {
    return {
      name: 'Winter Solstice',
      type: 'celestial',
      startDate: new Date(date.getFullYear(), 11, 19),
      endDate: new Date(date.getFullYear(), 11, 23),
      effects: {
        atmosphereChanges: {
          lighting: 'mystical_twilight',
          colors: ['deep_blue', 'silver', 'white'],
        },
        specialProducts: ['solstice_candles', 'winter_crystals'],
        spiritBehavior: 'reflective_and_wise',
        rarityBoost: 0.3,
      },
    };
  }
  
  // Full Moon Magic (day of full moon)
  const temporal = getCurrentTemporalState();
  if (temporal.moonPhase === 'full') {
    return {
      name: 'Full Moon Gathering',
      type: 'celestial',
      startDate: date,
      endDate: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      effects: {
        atmosphereChanges: {
          lighting: 'moonlit_glow',
          energy: 'heightened',
        },
        specialProducts: ['moonstone_items', 'lunar_rituals'],
        spiritBehavior: 'energetic_and_mysterious',
        rarityBoost: 0.5,
      },
    };
  }
  
  return undefined;
}

/**
 * Adapt hall atmosphere to time of day
 */
export function adaptAtmosphereToTime(
  baseAtmosphere: any,
  temporal: TemporalState
): any {
  const timeAdaptations: Record<string, any> = {
    dawn: {
      lighting: 'soft_golden',
      energy: 'awakening',
      message: 'The city awakens with gentle possibility',
      ambientSound: 'morning_birds',
    },
    morning: {
      lighting: 'bright_clear',
      energy: 'active',
      message: 'Vibrant energy flows through every street',
      ambientSound: 'bustling_life',
    },
    afternoon: {
      lighting: 'full_bright',
      energy: 'steady',
      message: 'The day unfolds in perfect rhythm',
      ambientSound: 'marketplace_hum',
    },
    dusk: {
      lighting: 'amber_fade',
      energy: 'transitional',
      message: 'The golden hour casts magic on everything',
      ambientSound: 'evening_chimes',
    },
    evening: {
      lighting: 'warm_glow',
      energy: 'contemplative',
      message: 'Night settles with peaceful enchantment',
      ambientSound: 'crickets_distant',
    },
    night: {
      lighting: 'moonlit_blue',
      energy: 'mysterious',
      message: 'Secrets whisper in the starlight',
      ambientSound: 'night_whispers',
    },
    midnight: {
      lighting: 'ethereal_dark',
      energy: 'liminal',
      message: 'Between worlds, between moments',
      ambientSound: 'deep_silence',
    },
  };
  
  const adaptation = timeAdaptations[temporal.timeOfDay];
  
  return {
    ...baseAtmosphere,
    ...adaptation,
    temporal_state: temporal,
    season: temporal.season,
    moon_phase: temporal.moonPhase,
  };
}

/**
 * Generate time-sensitive recommendations
 */
export function getTimeSensitiveRecommendations(temporal: TemporalState): {
  chapels: string[];
  products: string[];
  activities: string[];
} {
  const recommendations: Record<string, any> = {
    dawn: {
      chapels: ['quiet-thoughts', 'haven-serenity'],
      products: ['morning_tea', 'meditation_cushion'],
      activities: ['morning_meditation', 'intention_setting'],
    },
    night: {
      chapels: ['chamber-mysteries', 'quiet-thoughts'],
      products: ['night_candles', 'dream_journal'],
      activities: ['night_reflection', 'star_gazing'],
    },
    full: { // Full moon
      chapels: ['alcove-wonder', 'chamber-mysteries'],
      products: ['moon_water', 'crystal_charging'],
      activities: ['moon_ritual', 'manifestation_work'],
    },
  };
  
  const timeRec = recommendations[temporal.timeOfDay] || recommendations.dawn;
  const moonRec = temporal.moonPhase === 'full' ? recommendations.full : null;
  
  return {
    chapels: [...(moonRec?.chapels || []), ...timeRec.chapels],
    products: [...(moonRec?.products || []), ...timeRec.products],
    activities: [...(moonRec?.activities || []), ...timeRec.activities],
  };
}

/**
 * Seasonal product rotation
 */
export function getSeasonalProducts(season: string): {
  featured: string[];
  hidden: string[];
  bonusDiscount: number;
} {
  const seasonal: Record<string, any> = {
    spring: {
      featured: ['flower_essence', 'renewal_kit', 'garden_seeds'],
      hidden: ['winter_items'],
      bonusDiscount: 0.15,
    },
    summer: {
      featured: ['sunstone_jewelry', 'energy_crystals', 'light_weaving'],
      hidden: ['winter_items'],
      bonusDiscount: 0.10,
    },
    autumn: {
      featured: ['harvest_bundles', 'amber_incense', 'transformation_tools'],
      hidden: ['summer_items'],
      bonusDiscount: 0.20,
    },
    winter: {
      featured: ['solstice_candles', 'introspection_journals', 'warmth_elixirs'],
      hidden: ['summer_items'],
      bonusDiscount: 0.25,
    },
  };
  
  return seasonal[season] || seasonal.spring;
}
