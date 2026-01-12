/**
 * Ritual Interaction System
 * Manages daily, seasonal, and mood-triggered ceremonies in the living city
 */

import { eventBus, publishRitualEvent } from './event-bus';
import { supabaseAdmin } from '../supabaseClient';
import { callOpenAI } from '../ai/openaiClient';

export interface Ritual {
  id: string;
  name: string;
  type: 'daily' | 'seasonal' | 'mood_triggered' | 'district_specific';
  district: string;
  trigger_condition: RitualTrigger;
  participants: RitualParticipant[];
  duration: number; // minutes
  atmosphere: RitualAtmosphere;
  script: RitualScript;
  effects: RitualEffect[];
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  scheduled_time?: string;
  actual_start?: string;
  actual_end?: string;
  created_at: string;
  updated_at: string;
}

export interface RitualTrigger {
  type: 'time' | 'mood' | 'participant_count' | 'manual';
  time_condition?: {
    hour: number;
    minute: number;
    days_of_week?: number[];
  };
  mood_condition?: {
    emotional_state: string;
    intensity_threshold: number;
    duration_minutes: number;
  };
  participant_condition?: {
    min_count: number;
    max_count?: number;
  };
}

export interface RitualParticipant {
  id: string;
  type: 'citizen' | 'user';
  role: 'facilitator' | 'participant' | 'observer';
  joined_at?: string;
  contribution?: string;
}

export interface RitualAtmosphere {
  lighting: 'bright' | 'dim' | 'neon' | 'warm' | 'cool' | 'dynamic';
  sound_theme: string;
  color_palette: string[];
  particle_effects?: string[];
  ambient_text: string;
}

export interface RitualScript {
  introduction: string;
  main_ceremony: string[];
  conclusion: string;
  facilitator_lines: Record<string, string>;
  participant_responses: string[];
}

export interface RitualEffect {
  type: 'mood_boost' | 'energy_restore' | 'memory_creation' | 'relationship_boost' | 'district_atmosphere';
  target: 'participants' | 'district' | 'all_nearby';
  value: number;
  duration: number; // minutes
}

export class RitualSystem {
  private rituals: Map<string, Ritual> = new Map();
  private activeRituals: Set<string> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners
   */
  private initializeEventListeners(): void {
    // Listen for mood changes that might trigger rituals
    eventBus.subscribe({
      id: 'ritual-mood-trigger',
      eventTypes: ['mood:shift'],
      callback: (event) => this.checkMoodTriggeredRituals(event)
    });

    // Listen for citizen gatherings that might trigger rituals
    eventBus.subscribe({
      id: 'ritual-citizen-gathering',
      eventTypes: ['citizen:action'],
      callback: (event) => this.checkParticipantTriggeredRituals(event)
    });
  }

  /**
   * Start the ritual system
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    console.log('🕯️ Starting Ritual Interaction System...');
    this.isRunning = true;

    // Load existing rituals
    await this.loadRituals();

    // Start checking for ritual triggers every minute
    this.checkInterval = setInterval(() => {
      this.checkScheduledRituals();
    }, 60000);

    // Initialize default rituals
    await this.initializeDefaultRituals();
  }

  /**
   * Stop the ritual system
   */
  stop(): void {
    if (!this.isRunning) return;

    console.log('🛑 Stopping Ritual Interaction System...');
    this.isRunning = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Save all rituals
    this.saveAllRituals();
  }

  /**
   * Load rituals from database
   */
  private async loadRituals(): Promise<void> {
    try {
      const { data: rituals, error } = await supabaseAdmin()
        .from('ritual_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      rituals?.forEach(ritual => {
        this.rituals.set(ritual.id, ritual as Ritual);
      });

      console.log(`📖 Loaded ${this.rituals.size} rituals from database`);
    } catch (error) {
      console.error('Error loading rituals:', error);
    }
  }

  /**
   * Save all rituals to database
   */
  private async saveAllRituals(): Promise<void> {
    const promises = Array.from(this.rituals.values()).map(ritual =>
      supabaseAdmin().from('ritual_events').upsert({
        ...ritual,
        updated_at: new Date().toISOString()
      })
    );

    await Promise.allSettled(promises);
    console.log(`💾 Saved ${this.rituals.size} rituals to database`);
  }

  /**
   * Initialize default rituals for each district
   */
  private async initializeDefaultRituals(): Promise<void> {
    const districts = ['innovation_district', 'wellness_way', 'neon_boulevard', 'makers_sanctuary'];

    for (const district of districts) {
      await this.createDefaultRitualsForDistrict(district);
    }
  }

  /**
   * Create default rituals for a district
   */
  private async createDefaultRitualsForDistrict(district: string): Promise<void> {
    const defaultRituals = this.getDefaultRitualsForDistrict(district);

    for (const ritualData of defaultRituals) {
      const existing = Array.from(this.rituals.values()).find(r =>
        r.district === district && r.name === ritualData.name
      );

      if (!existing) {
        const ritual: Ritual = {
          id: `ritual_${district}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...ritualData,
          district,
          participants: [],
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        this.rituals.set(ritual.id, ritual);
        await supabaseAdmin().from('ritual_events').insert(ritual);
      }
    }
  }

  /**
   * Get default rituals for a district
   */
  private getDefaultRitualsForDistrict(district: string): Omit<Ritual, 'id' | 'district' | 'participants' | 'status' | 'created_at' | 'updated_at'>[] {
    const baseRituals = [
      {
        name: 'Dawn Greeting',
        type: 'daily' as const,
        trigger_condition: {
          type: 'time',
          time_condition: { hour: 6, minute: 0 }
        },
        duration: 15,
        atmosphere: {
          lighting: 'warm' as const,
          sound_theme: 'gentle_bells',
          color_palette: ['#FFA500', '#FFD700', '#FFFFFF'],
          ambient_text: 'The first light touches the city, awakening its spirit.'
        },
        script: {
          introduction: 'As the sun rises, we gather to greet the new day.',
          main_ceremony: [
            'Feel the warmth of the morning light',
            'Share your intentions for the day',
            'Connect with the city\'s awakening energy'
          ],
          conclusion: 'May this day bring you peace and discovery.',
          facilitator_lines: {
            welcome: 'Welcome, seekers of the dawn.',
            transition: 'Let us begin our morning communion.'
          },
          participant_responses: ['I am here.', 'I feel the light.', 'I am ready.']
        },
        effects: [
          {
            type: 'energy_restore' as const,
            target: 'participants' as const,
            value: 20,
            duration: 120
          },
          {
            type: 'mood_boost' as const,
            target: 'district' as const,
            value: 5,
            duration: 60
          }
        ]
      },
      {
        name: 'Evening Reflection',
        type: 'daily' as const,
        trigger_condition: {
          type: 'time',
          time_condition: { hour: 18, minute: 0 }
        },
        duration: 20,
        atmosphere: {
          lighting: 'dim' as const,
          sound_theme: 'soft_strings',
          color_palette: ['#4B0082', '#8A2BE2', '#DA70D6'],
          ambient_text: 'As day fades, we reflect on what we have learned.'
        },
        script: {
          introduction: 'The day draws to a close. Let us reflect together.',
          main_ceremony: [
            'Share a moment of gratitude',
            'Release what no longer serves you',
            'Prepare for the night\'s wisdom'
          ],
          conclusion: 'May your dreams be filled with insight.',
          facilitator_lines: {
            welcome: 'Welcome to our evening circle.',
            transition: 'Let us turn inward.'
          },
          participant_responses: ['I am grateful.', 'I release.', 'I am open.']
        },
        effects: [
          {
            type: 'mood_boost' as const,
            target: 'participants' as const,
            value: 10,
            duration: 180
          }
        ]
      }
    ];

    // District-specific rituals
    const districtRituals = {
      innovation_district: [
        {
          name: 'Idea Storm',
          type: 'mood_triggered' as const,
          trigger_condition: {
            type: 'mood',
            mood_condition: {
              emotional_state: 'energetic',
              intensity_threshold: 7,
              duration_minutes: 30
            }
          },
          duration: 30,
          atmosphere: {
            lighting: 'bright' as const,
            sound_theme: 'electric_hum',
            color_palette: ['#00FF00', '#00FFFF', '#FF00FF'],
            particle_effects: ['sparks', 'data_streams']
          },
          script: {
            introduction: 'Innovation calls! Let the ideas flow!',
            main_ceremony: [
              'Share your wildest ideas',
              'Build upon each other\'s visions',
              'Let creativity surge through us'
            ],
            conclusion: 'May these ideas shape tomorrow.',
            facilitator_lines: {
              welcome: 'Welcome, innovators!',
              transition: 'Unleash your creativity!'
            },
            participant_responses: ['I have an idea!', 'Let\'s build this!', 'Yes!']
          },
          effects: [
            {
              type: 'energy_restore' as const,
              target: 'participants' as const,
              value: 30,
              duration: 60
            }
          ]
        }
      ],
      wellness_way: [
        {
          name: 'Energy Sharing',
          type: 'mood_triggered' as const,
          trigger_condition: {
            type: 'mood',
            mood_condition: {
              emotional_state: 'peaceful',
              intensity_threshold: 6,
              duration_minutes: 20
            }
          },
          duration: 25,
          atmosphere: {
            lighting: 'warm' as const,
            sound_theme: 'gentle_waves',
            color_palette: ['#98FB98', '#F0E68C', '#DDA0DD']
          },
          script: {
            introduction: 'Let us share our inner light with one another.',
            main_ceremony: [
              'Breathe deeply together',
              'Visualize energy flowing between us',
              'Feel the collective harmony'
            ],
            conclusion: 'Carry this peace with you.',
            facilitator_lines: {
              welcome: 'Welcome to our energy circle.',
              transition: 'Let us breathe as one.'
            },
            participant_responses: ['I feel the energy.', 'Peace flows.', 'We are connected.']
          },
          effects: [
            {
              type: 'energy_restore' as const,
              target: 'participants' as const,
              value: 25,
              duration: 90
            },
            {
              type: 'relationship_boost' as const,
              target: 'participants' as const,
              value: 5,
              duration: 1440 // 24 hours
            }
          ]
        }
      ]
    };

    return [
      ...baseRituals,
      ...(districtRituals[district as keyof typeof districtRituals] || [])
    ];
  }

  /**
   * Check for scheduled rituals
   */
  private checkScheduledRituals(): void {
    if (!this.isRunning) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    this.rituals.forEach(ritual => {
      if (ritual.status === 'scheduled' && ritual.trigger_condition.type === 'time') {
        const timeCondition = ritual.trigger_condition.time_condition;
        if (timeCondition) {
          const triggerTime = `${timeCondition.hour.toString().padStart(2, '0')}:${timeCondition.minute.toString().padStart(2, '0')}`;

          if (currentTime === triggerTime) {
            this.triggerRitual(ritual.id);
          }
        }
      }
    });
  }

  /**
   * Check for mood-triggered rituals
   */
  private checkMoodTriggeredRituals(event: any): void {
    const { payload } = event;

    this.rituals.forEach(ritual => {
      if (ritual.status === 'scheduled' && ritual.trigger_condition.type === 'mood') {
        const moodCondition = ritual.trigger_condition.mood_condition;
        if (moodCondition &&
            payload.emotionalState === moodCondition.emotional_state &&
            payload.intensity >= moodCondition.intensity_threshold) {
          this.triggerRitual(ritual.id);
        }
      }
    });
  }

  /**
   * Check for participant-triggered rituals
   */
  private checkParticipantTriggeredRituals(event: any): void {
    const { payload } = event;

    if (payload.action === 'gathering_detected') {
      this.rituals.forEach(ritual => {
        if (ritual.status === 'scheduled' && ritual.trigger_condition.type === 'participant_count') {
          const participantCondition = ritual.trigger_condition.participant_condition;
          if (participantCondition && payload.participantCount >= participantCondition.min_count) {
            this.triggerRitual(ritual.id);
          }
        }
      });
    }
  }

  /**
   * Trigger a ritual
   */
  async triggerRitual(ritualId: string): Promise<void> {
    const ritual = this.rituals.get(ritualId);
    if (!ritual || ritual.status !== 'scheduled') return;

    console.log(`🕯️ Triggering ritual: ${ritual.name} in ${ritual.district}`);

    ritual.status = 'active';
    ritual.actual_start = new Date().toISOString();
    this.activeRituals.add(ritualId);

    // Publish ritual event
    publishRitualEvent({
      action: 'started',
      ritualId,
      ritualName: ritual.name,
      district: ritual.district,
      type: ritual.type,
      duration: ritual.duration
    });

    // Schedule ritual completion
    setTimeout(() => {
      this.completeRitual(ritualId);
    }, ritual.duration * 60000);

    // Update database
    await supabaseAdmin().from('ritual_events').update({
      status: 'active',
      actual_start: ritual.actual_start,
      updated_at: new Date().toISOString()
    }).eq('id', ritualId);
  }

  /**
   * Complete a ritual
   */
  private async completeRitual(ritualId: string): Promise<void> {
    const ritual = this.rituals.get(ritualId);
    if (!ritual || ritual.status !== 'active') return;

    console.log(`✅ Completing ritual: ${ritual.name}`);

    ritual.status = 'completed';
    ritual.actual_end = new Date().toISOString();
    this.activeRituals.delete(ritualId);

    // Apply ritual effects
    await this.applyRitualEffects(ritual);

    // Publish completion event
    publishRitualEvent({
      action: 'completed',
      ritualId,
      ritualName: ritual.name,
      district: ritual.district,
      participants: ritual.participants.length
    });

    // Update database
    await supabaseAdmin().from('ritual_events').update({
      status: 'completed',
      actual_end: ritual.actual_end,
      updated_at: new Date().toISOString()
    }).eq('id', ritualId);
  }

  /**
   * Apply ritual effects
   */
  private async applyRitualEffects(ritual: Ritual): Promise<void> {
    for (const effect of ritual.effects) {
      switch (effect.type) {
        case 'mood_boost':
          publishRitualEvent({
            action: 'effect_applied',
            effectType: 'mood_boost',
            target: effect.target,
            value: effect.value,
            duration: effect.duration
          });
          break;

        case 'energy_restore':
          // This would be handled by the citizen AI service
          publishRitualEvent({
            action: 'effect_applied',
            effectType: 'energy_restore',
            target: effect.target,
            value: effect.value,
            duration: effect.duration
          });
          break;

        case 'memory_creation':
          // Create shared memories for participants
          publishRitualEvent({
            action: 'effect_applied',
            effectType: 'memory_creation',
            target: effect.target,
            ritualName: ritual.name
          });
          break;
      }
    }
  }

  /**
   * Manually trigger a ritual
   */
  async triggerRitualManually(ritualId: string): Promise<boolean> {
    const ritual = this.rituals.get(ritualId);
    if (!ritual) return false;

    await this.triggerRitual(ritualId);
    return true;
  }

  /**
   * Add participant to ritual
   */
  async addParticipant(ritualId: string, participant: Omit<RitualParticipant, 'joined_at'>): Promise<void> {
    const ritual = this.rituals.get(ritualId);
    if (!ritual || ritual.status !== 'active') return;

    const newParticipant: RitualParticipant = {
      ...participant,
      joined_at: new Date().toISOString()
    };

    ritual.participants.push(newParticipant);

    publishRitualEvent({
      action: 'participant_joined',
      ritualId,
      participantId: participant.id,
      participantType: participant.type,
      role: participant.role
    });
  }

  /**
   * Get active rituals in a district
   */
  getActiveRituals(district: string): Ritual[] {
    return Array.from(this.rituals.values()).filter(ritual =>
      ritual.district === district && ritual.status === 'active'
    );
  }

  /**
   * Get all rituals
   */
  getAllRituals(): Ritual[] {
    return Array.from(this.rituals.values());
  }

  /**
   * Get ritual by ID
   */
  getRitual(ritualId: string): Ritual | undefined {
    return this.rituals.get(ritualId);
  }
}

// Global ritual system instance
export const ritualSystem = new RitualSystem();