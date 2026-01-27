/**
 * Living City Engine Orchestrator
 * Coordinates all Phase 3 autonomous systems
 */

import { citizenAIService } from './citizen-ai-service';
import { ritualSystem } from './ritual-system';
import { eventBus, publishMoodEvent, publishDistrictEvent } from './event-bus';
import { supabase } from '../supabaseClient';
import { log as ndLog } from '@/lib/server-ndjson';

export class LivingCityEngine {
  private isRunning = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private moodUpdateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners
   */
  private initializeEventListeners(): void {
    // Listen for system events
    eventBus.subscribe({
      id: 'living-city-engine',
      eventTypes: ['*'],
      callback: (event) => this.handleSystemEvent(event)
    });
  }

  /**
   * Start the living city engine
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    ndLog('info','engine_start',{engine:'LivingCityEngine'});
    this.isRunning = true;

    // Start all subsystems
    await citizenAIService.start();
    await ritualSystem.start();

    // Start periodic updates
    this.updateInterval = setInterval(() => {
      this.updateCityState();
    }, 30000); // Every 30 seconds

    // Start mood updates
    this.moodUpdateInterval = setInterval(() => {
      this.updateDistrictMoods();
    }, 60000); // Every minute

    ndLog('info','engine_started',{engine:'LivingCityEngine'});
  }

  /**
   * Stop the living city engine
   */
  stop(): void {
    if (!this.isRunning) return;

    ndLog('info','engine_stopping',{engine:'LivingCityEngine'});
    this.isRunning = false;

    // Stop all subsystems
    citizenAIService.stop();
    // ritualSystem.stop(); // Note: ritualSystem doesn't have a stop method yet

    // Clear intervals
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.moodUpdateInterval) {
      clearInterval(this.moodUpdateInterval);
      this.moodUpdateInterval = null;
    }

    ndLog('info','engine_stopped',{engine:'LivingCityEngine'});
  }

  /**
   * Update overall city state
   */
  private async updateCityState(): Promise<void> {
    try {
      // Get current city metrics
      const citizenCount = citizenAIService.getCitizenCount();
      const activeRituals = ritualSystem.getAllRituals().filter(r => r.status === 'active').length;

      // Get district activity
      const districts = ['innovation_district', 'wellness_way', 'neon_boulevard', 'makers_sanctuary'];
      const districtActivity = await Promise.all(
        districts.map(async (district) => {
          const { data: presence } = await supabase
            .from('presence_logs')
            .select('id')
            .eq('district', district)
            .is('exited_at', null);

          return {
            district,
            activeUsers: presence?.length || 0,
            activeCitizens: citizenAIService.getCitizensInDistrict(district).length
          };
        })
      );

      // Publish city state event
      eventBus.publish({
        type: 'city:state_update',
        payload: {
          citizenCount,
          activeRituals,
          districtActivity,
          timestamp: Date.now()
        },
        source: 'living_city_engine'
      });

    } catch (error) {
      ndLog('error','city_state_update_failed',{error: String(error)});
    }
  }

  /**
   * Update district moods based on activity
   */
  private async updateDistrictMoods(): Promise<void> {
    try {
      const districts = ['innovation_district', 'wellness_way', 'neon_boulevard', 'makers_sanctuary'];

      for (const district of districts) {
        // Get active users in district
        const { data: presence } = await supabase
          .from('presence_logs')
          .select('activity_type')
          .eq('district', district)
          .is('exited_at', null);

        const activeUsers = presence?.length || 0;
        const activityBreakdown = presence?.reduce((acc, p) => {
          acc[p.activity_type] = (acc[p.activity_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        // Get active citizens in district
        const activeCitizens = citizenAIService.getCitizensInDistrict(district).length;

        // Get active rituals
        const activeRituals = ritualSystem.getActiveRituals(district).length;

        // Calculate collective mood based on activity
        const baseValence = 0.5; // Neutral baseline
        const baseArousal = 0.3; // Calm baseline

        // Activity influences mood
        const userActivityBoost = Math.min(activeUsers * 0.1, 0.5);
        const citizenActivityBoost = Math.min(activeCitizens * 0.05, 0.3);
        const ritualBoost = activeRituals * 0.2;

        const collectiveMood = {
          valence: Math.min(1, baseValence + userActivityBoost + citizenActivityBoost + ritualBoost),
          arousal: Math.min(1, baseArousal + userActivityBoost + ritualBoost),
          dominance: 0.5 + (activeUsers > 5 ? 0.2 : 0) // More users = more dominant atmosphere
        };

        // Determine atmospheric data based on district and time
        const now = new Date();
        const hour = now.getHours();
        const timeOfDay = hour >= 6 && hour < 12 ? 'morning' :
                         hour >= 12 && hour < 18 ? 'afternoon' :
                         hour >= 18 && hour < 22 ? 'evening' : 'night';

        const atmosphericData = this.getDistrictAtmosphere(district, timeOfDay, collectiveMood);

        // Publish mood event
        publishMoodEvent({
          district,
          collectiveMood,
          atmosphericData,
          activeCitizens,
          activeUsers,
          activityBreakdown,
          timeOfDay
        });

        // Record in database
        await supabase.from('district_moods').insert({
          district,
          collective_mood: collectiveMood,
          atmospheric_data: atmosphericData,
          active_citizens: activeCitizens,
          active_users: activeUsers,
          ritual_active: activeRituals > 0,
          time_of_day: timeOfDay,
          season: this.getCurrentSeason(),
          recorded_at: now.toISOString()
        });
      }

    } catch (error) {
      ndLog('error','district_mood_update_failed',{error: String(error)});
    }
  }

  /**
   * Get atmospheric data for district
   */
  private getDistrictAtmosphere(district: string, timeOfDay: string, mood: any): any {
    const baseAtmosphere = {
      innovation_district: {
        lighting: 'bright',
        sound_theme: 'electronic',
        color_palette: ['#00FF00', '#00FFFF', '#FF00FF'],
        particle_effects: mood.arousal > 0.7 ? ['sparks', 'data_streams'] : []
      },
      wellness_way: {
        lighting: 'warm',
        sound_theme: 'ambient',
        color_palette: ['#98FB98', '#F0E68C', '#DDA0DD'],
        particle_effects: mood.valence > 0.8 ? ['gentle_glow'] : []
      },
      neon_boulevard: {
        lighting: 'neon',
        sound_theme: 'urban',
        color_palette: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
        particle_effects: mood.arousal > 0.6 ? ['neon_flashes'] : []
      },
      makers_sanctuary: {
        lighting: 'focused',
        sound_theme: 'industrial',
        color_palette: ['#FFA500', '#FF6B35', '#F7931E'],
        particle_effects: mood.arousal > 0.5 ? ['steam', 'sparks'] : []
      }
    };

    const atmosphere = { ...baseAtmosphere[district as keyof typeof baseAtmosphere] };

    // Adjust based on time of day
    switch (timeOfDay) {
      case 'morning':
        atmosphere.lighting = 'bright';
        break;
      case 'evening':
        atmosphere.lighting = 'dim';
        atmosphere.color_palette = atmosphere.color_palette.map(color => color + '80'); // Add transparency
        break;
      case 'night':
        atmosphere.lighting = 'neon';
        atmosphere.sound_theme += '_night';
        break;
    }

    // Adjust based on mood
    if (mood.valence > 0.8) {
      atmosphere.particle_effects.push('joy_sparkles');
    } else if (mood.valence < 0.3) {
      atmosphere.sound_theme += '_calm';
    }

    return atmosphere;
  }

  /**
   * Get current season
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    return month >= 3 && month <= 5 ? 'spring' :
           month >= 6 && month <= 8 ? 'summer' :
           month >= 9 && month <= 11 ? 'fall' : 'winter';
  }

  /**
   * Handle system events
   */
  private handleSystemEvent(event: any): void {
    // Log important events
    if (event.type.startsWith('citizen:') ||
        event.type.startsWith('ritual:') ||
        event.type.startsWith('mood:') ||
        event.type === 'city:state_update') {
      ndLog('info','engine_event',{engine:'LivingCityEngine', event: event.type, payload: event.payload});
    }
  }

  /**
   * Get city status
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      citizens: citizenAIService.getCitizenCount(),
      activeRituals: ritualSystem.getAllRituals().filter(r => r.status === 'active').length,
      timestamp: new Date().toISOString()
    };
  }
}

// Global living city engine instance
export const livingCityEngine = new LivingCityEngine();