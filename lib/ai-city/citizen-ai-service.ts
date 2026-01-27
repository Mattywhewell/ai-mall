/**
 * Autonomous Citizens v2
 * AI-driven citizens with personalities, memories, and autonomous behavior
 */

import { eventBus, publishCitizenEvent } from './event-bus';
import { supabaseAdmin } from '../supabaseClient';
import { callOpenAI } from '../ai/openaiClient';
import { log as ndLog } from '@/lib/server-ndjson';

export interface CitizenState {
  id: string;
  name: string;
  personality: CitizenPersonality;
  currentMood: CitizenMood;
  position: { x: number; y: number; z: number; district: string };
  currentActivity: CitizenActivity;
  schedule: CitizenSchedule;
  memories: CitizenMemory[];
  relationships: Record<string, number>; // citizen_id -> relationship strength
  energy: number; // 0-100
  lastInteraction?: string;
  created_at: string;
  updated_at: string;
}

export interface CitizenPersonality {
  traits: string[];
  voice_style: 'warm' | 'mysterious' | 'energetic' | 'contemplative' | 'playful';
  interests: string[];
  fears: string[];
  goals: string[];
  backstory: string;
}

export interface CitizenMood {
  emotional_state: 'curious' | 'contemplative' | 'joyful' | 'melancholic' | 'energetic' | 'anxious' | 'peaceful' | 'excited';
  intensity: number; // 0-10
  triggers: string[];
  duration: number; // minutes
}

export interface CitizenActivity {
  type: 'idle' | 'moving' | 'interacting' | 'ritual' | 'resting' | 'exploring';
  target?: string; // user_id, location, or other citizen_id
  startTime: number;
  estimatedDuration: number;
}

export interface CitizenSchedule {
  daily_routine: ScheduleEntry[];
  special_events: ScheduleEntry[];
  flexibility: number; // how likely to deviate from schedule (0-1)
}

export interface ScheduleEntry {
  time: string; // HH:MM format
  activity: string;
  location: string;
  duration: number; // minutes
  priority: number; // 1-10
}

export interface CitizenMemory {
  id: string;
  type: 'interaction' | 'event' | 'observation' | 'ritual';
  content: string;
  emotional_impact: number; // -10 to 10
  timestamp: number;
  context: Record<string, any>;
}

export class CitizenAIService {
  private citizens: Map<string, CitizenState> = new Map();
  private isRunning = false;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeEventListeners();
  }

  /**
   * Initialize event bus listeners
   */
  private initializeEventListeners(): void {
    // Listen for user interactions
    eventBus.subscribe({
      id: 'citizen-user-interaction',
      eventTypes: ['user:action'],
      callback: (event) => this.handleUserInteraction(event)
    });

    // Listen for ritual events
    eventBus.subscribe({
      id: 'citizen-ritual-events',
      eventTypes: ['ritual:trigger'],
      callback: (event) => this.handleRitualEvent(event)
    });

    // Listen for mood changes
    eventBus.subscribe({
      id: 'citizen-mood-changes',
      eventTypes: ['mood:shift'],
      callback: (event) => this.handleMoodChange(event)
    });
  }

  /**
   * Start the citizen AI system
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    ndLog('info','citizen_service_start',{service:'CitizenAIService'});
    this.isRunning = true;

    // Load existing citizens from database
    await this.loadCitizens();

    // Start update loop (every 5 seconds)
    this.updateInterval = setInterval(() => {
      this.updateCitizens();
    }, 5000);

    // Publish system start event
    publishCitizenEvent({
      action: 'system_started',
      citizenCount: this.citizens.size
    });
  }

  /**
   * Stop the citizen AI system
   */
  stop(): void {
    if (!this.isRunning) return;

    ndLog('info','citizen_service_stopping',{service:'CitizenAIService'});
    this.isRunning = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Save all citizens to database
    this.saveAllCitizens();
  }

  /**
   * Load citizens from database
   */
  private async loadCitizens(): Promise<void> {
    try {
      const { data: citizens, error } = await supabaseAdmin()
        .from('citizen_states')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      citizens?.forEach(citizen => {
        // Transform database fields to interface fields
        const transformedCitizen: CitizenState = {
          id: citizen.id,
          name: citizen.name,
          personality: citizen.personality,
          currentMood: citizen.current_mood,
          position: citizen.position,
          currentActivity: citizen.current_activity, // Map snake_case to camelCase
          schedule: citizen.schedule,
          memories: citizen.memories,
          relationships: citizen.relationships,
          energy: citizen.energy,
          lastInteraction: citizen.last_interaction,
          created_at: citizen.created_at,
          updated_at: citizen.updated_at
        };
        this.citizens.set(citizen.id, transformedCitizen);
      });

      ndLog('info','citizens_loaded',{count: this.citizens.size});
    } catch (error) {
      ndLog('error','load_citizens_failed',{error: String(error)});
    }
  }

  /**
   * Save all citizens to database
   */
  private async saveAllCitizens(): Promise<void> {
    const promises = Array.from(this.citizens.values()).map(citizen =>
      supabaseAdmin().from('citizen_states').upsert({
        id: citizen.id,
        name: citizen.name,
        personality: citizen.personality,
        current_mood: citizen.currentMood,
        position: citizen.position,
        current_activity: citizen.currentActivity,
        schedule: citizen.schedule,
        memories: citizen.memories,
        relationships: citizen.relationships,
        energy: citizen.energy,
        last_interaction: citizen.lastInteraction,
        created_at: citizen.created_at,
        updated_at: new Date().toISOString()
      })
    );

    await Promise.allSettled(promises);
    ndLog('info','citizens_saved',{count: this.citizens.size});
  }

  /**
   * Spawn a new citizen
   */
  async spawnCitizen(district: string, position: { x: number; y: number; z: number }): Promise<string> {
    const personality = await this.generatePersonality();

    const citizen: CitizenState = {
      id: `citizen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: await this.generateName(personality),
      personality,
      currentMood: {
        emotional_state: 'curious',
        intensity: 5,
        triggers: [],
        duration: 30
      },
      position: { ...position, district },
      currentActivity: {
        type: 'idle',
        startTime: Date.now(),
        estimatedDuration: 300000 // 5 minutes
      },
      schedule: this.generateSchedule(),
      memories: [],
      relationships: {},
      energy: 80,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.citizens.set(citizen.id, citizen);

    // Save to database
    ndLog('info','saving_citizen',{citizenId: citizen.id});
    const dbCitizen = {
      id: citizen.id,
      name: citizen.name,
      personality: citizen.personality,
      current_mood: citizen.currentMood,
      position: citizen.position,
      current_activity: citizen.currentActivity,
      schedule: citizen.schedule,
      memories: citizen.memories,
      relationships: citizen.relationships,
      energy: citizen.energy,
      created_at: citizen.created_at,
      updated_at: citizen.updated_at
    };
    const result = await supabaseAdmin().from('citizen_states').insert(dbCitizen);
    ndLog('info','save_result',{citizenId: citizen.id, result});

    publishCitizenEvent({
      action: 'spawned',
      citizenId: citizen.id,
      district,
      position
    });

    return citizen.id;
  }

  /**
   * Update all citizens
   */
  private updateCitizens(): void {
    if (!this.isRunning) return;

    this.citizens.forEach(citizen => {
      this.updateCitizen(citizen);
    });
  }

  /**
   * Update a single citizen
   */
  private updateCitizen(citizen: CitizenState): void {
    // Update energy based on activity
    this.updateEnergy(citizen);

    // Update mood based on time and context
    this.updateMood(citizen);

    // Decide next action
    this.decideNextAction(citizen);

    // Execute current activity
    this.executeActivity(citizen);
  }

  /**
   * Update citizen energy
   */
  private updateEnergy(citizen: CitizenState): void {
    const activity = citizen.currentActivity;

    switch (activity.type) {
      case 'resting':
        citizen.energy = Math.min(100, citizen.energy + 2);
        break;
      case 'moving':
      case 'exploring':
        citizen.energy = Math.max(0, citizen.energy - 1);
        break;
      case 'interacting':
      case 'ritual':
        citizen.energy = Math.max(0, citizen.energy - 0.5);
        break;
      default:
        citizen.energy = Math.max(0, citizen.energy - 0.2);
    }
  }

  /**
   * Update citizen mood
   */
  private updateMood(citizen: CitizenState): void {
    const mood = citizen.currentMood;
    const now = Date.now();

    // Check if mood duration has expired
    if (now - (mood.duration * 60000) > (citizen.lastInteraction ? Date.parse(citizen.lastInteraction!) : 0)) {
      // Generate new mood based on personality and context
      this.generateNewMood(citizen);
    }
  }

  /**
   * Generate a new mood for the citizen
   */
  private generateNewMood(citizen: CitizenState): void {
    const personality = citizen.personality;
    const timeOfDay = new Date().getHours();

    // Base mood on personality and time
    let emotionalState: CitizenMood['emotional_state'] = 'peaceful';
    let intensity = 5;

    if (personality.traits.includes('energetic') && timeOfDay >= 6 && timeOfDay <= 18) {
      emotionalState = 'energetic';
      intensity = 7;
    } else if (personality.traits.includes('contemplative') && timeOfDay >= 20) {
      emotionalState = 'contemplative';
      intensity = 6;
    } else if (personality.traits.includes('joyful')) {
      emotionalState = 'joyful';
      intensity = 8;
    }

    citizen.currentMood = {
      emotional_state: emotionalState,
      intensity,
      triggers: ['time_of_day', 'personality'],
      duration: 30 + Math.random() * 60 // 30-90 minutes
    };
  }

  /**
   * Decide next action for citizen
   */
  private decideNextAction(citizen: CitizenState): void {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    // Check schedule first
    const scheduledActivity = this.getScheduledActivity(citizen, timeString);
    if (scheduledActivity && Math.random() < (1 - citizen.schedule.flexibility)) {
      this.setActivity(citizen, scheduledActivity.activity as CitizenActivity['type'], scheduledActivity.location);
      return;
    }

    // Energy-based decisions
    if (citizen.energy < 20) {
      this.setActivity(citizen, 'resting');
      return;
    }

    // Mood-based decisions
    const mood = citizen.currentMood.emotional_state;
    switch (mood) {
      case 'curious':
        if (Math.random() < 0.7) {
          this.setActivity(citizen, 'exploring');
        }
        break;
      case 'energetic':
        if (Math.random() < 0.8) {
          this.setActivity(citizen, 'moving', this.getRandomLocation(citizen.position.district));
        }
        break;
      case 'contemplative':
        if (Math.random() < 0.6) {
          this.setActivity(citizen, 'idle');
        }
        break;
    }

    // Default: continue current activity or go idle
    if (!citizen.currentActivity || Date.now() - citizen.currentActivity.startTime > citizen.currentActivity.estimatedDuration) {
      this.setActivity(citizen, 'idle');
    }
  }

  /**
   * Execute current activity
   */
  private executeActivity(citizen: CitizenState): void {
    const activity = citizen.currentActivity;

    switch (activity.type) {
      case 'moving':
        this.moveCitizen(citizen);
        break;
      case 'exploring':
        this.exploreCitizen(citizen);
        break;
      case 'interacting':
        this.interactCitizen(citizen);
        break;
    }
  }

  /**
   * Move citizen to target location
   */
  private moveCitizen(citizen: CitizenState): void {
    // Simple movement logic - in real implementation, this would use pathfinding
    const target = citizen.currentActivity.target;
    if (target) {
      // Parse target as coordinates
      const [x, y, z] = target.split(',').map(Number);
      const dx = x - citizen.position.x;
      const dy = y - citizen.position.y;
      const dz = z - citizen.position.z;

      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < 0.5) {
        // Reached destination
        this.setActivity(citizen, 'idle');
      } else {
        // Move towards target
        const speed = 0.1;
        citizen.position.x += (dx / distance) * speed;
        citizen.position.y += (dy / distance) * speed;
        citizen.position.z += (dz / distance) * speed;
      }
    }
  }

  /**
   * Handle exploration activity
   */
  private exploreCitizen(citizen: CitizenState): void {
    // Random movement within district
    const directions = [
      { x: 0.1, y: 0, z: 0 },
      { x: -0.1, y: 0, z: 0 },
      { x: 0, y: 0, z: 0.1 },
      { x: 0, y: 0, z: -0.1 }
    ];

    const direction = directions[Math.floor(Math.random() * directions.length)];
    citizen.position.x += direction.x;
    citizen.position.y += direction.y;
    citizen.position.z += direction.z;

    // Occasionally change activity
    if (Math.random() < 0.05) {
      this.setActivity(citizen, 'idle');
    }
  }

  /**
   * Handle citizen interaction
   */
  private interactCitizen(citizen: CitizenState): void {
    // Interaction logic would be implemented here
    // For now, just complete the interaction
    if (Math.random() < 0.1) {
      this.setActivity(citizen, 'idle');
    }
  }

  /**
   * Set citizen activity
   */
  private setActivity(citizen: CitizenState, type: CitizenActivity['type'], target?: string, duration?: number): void {
    citizen.currentActivity = {
      type,
      target,
      startTime: Date.now(),
      estimatedDuration: duration || (5 + Math.random() * 10) * 60000 // 5-15 minutes
    };

    publishCitizenEvent({
      action: 'activity_changed',
      citizenId: citizen.id,
      activity: type,
      target
    });
  }

  /**
   * Get scheduled activity for current time
   */
  private getScheduledActivity(citizen: CitizenState, timeString: string): ScheduleEntry | null {
    return citizen.schedule.daily_routine.find(entry => entry.time === timeString) || null;
  }

  /**
   * Get random location in district
   */
  private getRandomLocation(district: string): string {
    const x = (Math.random() - 0.5) * 20;
    const y = 0;
    const z = (Math.random() - 0.5) * 20;
    return `${x},${y},${z}`;
  }

  /**
   * Generate citizen personality
   */
  private async generatePersonality(): Promise<CitizenPersonality> {
    const traits = [
      'curious', 'helpful', 'mysterious', 'energetic', 'contemplative',
      'joyful', 'cautious', 'creative', 'scholarly', 'adventurous'
    ];

    const selectedTraits = [];
    for (let i = 0; i < 3; i++) {
      const trait = traits[Math.floor(Math.random() * traits.length)];
      if (!selectedTraits.includes(trait)) {
        selectedTraits.push(trait);
      }
    }

    const voiceStyles: CitizenPersonality['voice_style'][] = ['warm', 'mysterious', 'energetic', 'contemplative', 'playful'];
    const voiceStyle = voiceStyles[Math.floor(Math.random() * voiceStyles.length)];

    return {
      traits: selectedTraits,
      voice_style: voiceStyle,
      interests: ['art', 'technology', 'nature', 'community', 'knowledge'],
      fears: ['isolation', 'conflict', 'loss'],
      goals: ['help others', 'learn new things', 'create beauty'],
      backstory: 'A resident of the Aiverse who has lived here since its early days.'
    };
  }

  /**
   * Generate citizen name
   */
  private async generateName(personality: CitizenPersonality): Promise<string> {
    const prefixes = ['Aria', 'Kai', 'Luna', 'Orion', 'Sage', 'Terra', 'Zephyr', 'Nova'];
    const suffixes = ['Light', 'Dream', 'Echo', 'Shadow', 'Star', 'Wind', 'Wave', 'Flame'];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    return `${prefix}${suffix}`;
  }

  /**
   * Generate default schedule
   */
  private generateSchedule(): CitizenSchedule {
    return {
      daily_routine: [
        { time: '06:00', activity: 'ritual', location: 'dawn_square', duration: 30, priority: 8 },
        { time: '09:00', activity: 'exploring', location: 'district_center', duration: 120, priority: 5 },
        { time: '12:00', activity: 'idle', location: 'central_park', duration: 60, priority: 3 },
        { time: '18:00', activity: 'ritual', location: 'evening_gathering', duration: 45, priority: 7 },
        { time: '22:00', activity: 'resting', location: 'home', duration: 480, priority: 9 }
      ],
      special_events: [],
      flexibility: 0.3
    };
  }

  /**
   * Handle user interaction events
   */
  private handleUserInteraction(event: any): void {
    const { payload } = event;
    if (payload.userId && payload.location) {
      // Find nearby citizens
      const nearbyCitizens = Array.from(this.citizens.values()).filter(citizen =>
        citizen.position.district === payload.location.district &&
        this.getDistance(citizen.position, payload.location) < 10
      );

      nearbyCitizens.forEach(citizen => {
        // Citizens might respond to user presence
        if (Math.random() < 0.3) {
          this.setActivity(citizen, 'interacting', payload.userId);
          citizen.lastInteraction = new Date().toISOString();
        }
      });
    }
  }

  /**
   * Handle ritual events
   */
  private handleRitualEvent(event: any): void {
    const { payload } = event;
    if (payload.location) {
      // Citizens in the area might join the ritual
      const nearbyCitizens = Array.from(this.citizens.values()).filter(citizen =>
        citizen.position.district === payload.location.district &&
        this.getDistance(citizen.position, payload.location) < 15
      );

      nearbyCitizens.forEach(citizen => {
        if (Math.random() < 0.7) { // 70% chance to join ritual
          this.setActivity(citizen, 'ritual', payload.ritualId);
        }
      });
    }
  }

  /**
   * Handle mood change events
   */
  private handleMoodChange(event: any): void {
    const { payload } = event;
    if (payload.district) {
      // Citizens in the district might be affected by collective mood
      const districtCitizens = Array.from(this.citizens.values()).filter(citizen =>
        citizen.position.district === payload.district
      );

      districtCitizens.forEach(citizen => {
        // Mood contagion
        if (Math.random() < 0.4) {
          citizen.currentMood.emotional_state = payload.emotionalState;
          citizen.currentMood.intensity = payload.intensity;
          citizen.currentMood.triggers.push('collective_mood');
        }
      });
    }
  }

  /**
   * Calculate distance between positions
   */
  private getDistance(pos1: { x: number; y: number; z: number }, pos2: { x: number; y: number; z: number }): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Get citizen by ID
   */
  getCitizen(citizenId: string): CitizenState | undefined {
    return this.citizens.get(citizenId);
  }

  /**
   * Get all citizens in a district
   */
  getCitizensInDistrict(district: string): CitizenState[] {
    return Array.from(this.citizens.values()).filter(citizen =>
      citizen.position.district === district
    );
  }

  /**
   * Get citizen count
   */
  getCitizenCount(): number {
    return this.citizens.size;
  }
}

// Global citizen AI service instance
export const citizenAIService = new CitizenAIService();