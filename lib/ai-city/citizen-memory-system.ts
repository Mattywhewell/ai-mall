/**
 * Citizen Memory System Extension
 * Extends the Memory Garden to support citizen personalities and memory-driven behavior
 */

import { createMemory, calculateMemoryStrength, UserMemory } from './memory-garden';
import { CitizenState, CitizenMemory, CitizenPersonality } from './citizen-ai-service';
import { supabase } from '../supabaseClient';
import { log as ndLog } from '@/lib/server-ndjson';

export interface CitizenMemoryGarden {
  citizenId: string;
  episodicMemories: CitizenMemory[]; // Specific events
  semanticMemories: CitizenMemory[]; // General knowledge
  proceduralMemories: CitizenMemory[]; // Learned behaviors
  emotionalAssociations: Record<string, number>; // location/emotion -> strength
  personalityEvolution: PersonalityEvolution[];
  lastUpdated: string;
}

export interface PersonalityEvolution {
  timestamp: number;
  trait: string;
  change: number; // -1 to 1, how much the trait changed
  trigger: string; // what caused the change
  context: Record<string, any>;
}

/**
 * Create a citizen memory
 */
export function createCitizenMemory(
  citizenId: string,
  type: CitizenMemory['type'],
  content: string,
  emotionalImpact: number,
  context: Record<string, any> = {}
): CitizenMemory {
  return {
    id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    content,
    emotional_impact: emotionalImpact,
    timestamp: Date.now(),
    context
  };
}

/**
 * Add memory to citizen's garden
 */
export function addCitizenMemory(
  garden: CitizenMemoryGarden,
  memory: CitizenMemory
): void {
  switch (memory.type) {
    case 'interaction':
    case 'event':
      garden.episodicMemories.push(memory);
      // Keep only recent episodic memories
      if (garden.episodicMemories.length > 100) {
        garden.episodicMemories.shift();
      }
      break;

    case 'observation':
      garden.semanticMemories.push(memory);
      // Keep only strong semantic memories
      garden.semanticMemories = garden.semanticMemories
        .sort((a, b) => Math.abs(b.emotional_impact) - Math.abs(a.emotional_impact))
        .slice(0, 50);
      break;

    case 'ritual':
      garden.proceduralMemories.push(memory);
      // Keep all procedural memories (rituals are important)
      break;
  }

  // Update emotional associations
  updateEmotionalAssociations(garden, memory);

  garden.lastUpdated = new Date().toISOString();
}

/**
 * Update emotional associations based on memory
 */
function updateEmotionalAssociations(
  garden: CitizenMemoryGarden,
  memory: CitizenMemory
): void {
  const location = memory.context.location || 'unknown';
  const currentStrength = garden.emotionalAssociations[location] || 0;

  // Emotional association strengthens with repeated experiences
  const learningRate = 0.1;
  garden.emotionalAssociations[location] =
    currentStrength + (memory.emotional_impact - currentStrength) * learningRate;
}

/**
 * Evolve citizen personality based on memories
 */
export function evolvePersonality(
  citizen: CitizenState,
  garden: CitizenMemoryGarden
): CitizenPersonality {
  const newPersonality = { ...citizen.personality };

  // Analyze recent memories for personality changes
  const recentMemories = [
    ...garden.episodicMemories.filter(m => Date.now() - m.timestamp < 7 * 24 * 60 * 60 * 1000), // Last 7 days
    ...garden.proceduralMemories.filter(m => Date.now() - m.timestamp < 30 * 24 * 60 * 60 * 1000) // Last 30 days
  ];

  // Calculate trait changes based on experiences
  const traitChanges: Record<string, number> = {};

  recentMemories.forEach(memory => {
    const impact = memory.emotional_impact;

    // Positive interactions make citizens more outgoing
    if (memory.type === 'interaction' && impact > 0.5) {
      traitChanges['outgoing'] = (traitChanges['outgoing'] || 0) + 0.1;
      traitChanges['shy'] = (traitChanges['shy'] || 0) - 0.1;
    }

    // Negative interactions make citizens more cautious
    if (memory.type === 'interaction' && impact < -0.5) {
      traitChanges['cautious'] = (traitChanges['cautious'] || 0) + 0.1;
      traitChanges['adventurous'] = (traitChanges['adventurous'] || 0) - 0.1;
    }

    // Successful rituals increase confidence
    if (memory.type === 'ritual' && impact > 0.3) {
      traitChanges['confident'] = (traitChanges['confident'] || 0) + 0.05;
    }

    // Exploring new areas increases curiosity
    if (memory.type === 'observation' && memory.content.includes('new') && impact > 0) {
      traitChanges['curious'] = (traitChanges['curious'] || 0) + 0.05;
    }
  });

  // Apply trait changes
  Object.entries(traitChanges).forEach(([trait, change]) => {
    if (change > 0.2) { // Only significant changes
      // Add trait if not present
      if (!newPersonality.traits.includes(trait)) {
        newPersonality.traits.push(trait);
      }

      // Remove opposite traits
      const opposites: Record<string, string> = {
        'outgoing': 'shy',
        'shy': 'outgoing',
        'cautious': 'adventurous',
        'adventurous': 'cautious'
      };

      if (opposites[trait] && newPersonality.traits.includes(opposites[trait])) {
        newPersonality.traits = newPersonality.traits.filter(t => t !== opposites[trait]);
      }

      // Record personality evolution
      garden.personalityEvolution.push({
        timestamp: Date.now(),
        trait,
        change,
        trigger: 'experience_accumulation',
        context: { memoriesAnalyzed: recentMemories.length }
      });
    }
  });

  // Keep only recent evolution records
  garden.personalityEvolution = garden.personalityEvolution
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);

  return newPersonality;
}

/**
 * Generate memory-driven behavior suggestions
 */
export function generateMemoryDrivenBehavior(
  citizen: CitizenState,
  garden: CitizenMemoryGarden
): string[] {
  const suggestions: string[] = [];

  // Avoid locations with negative associations
  const negativeLocations = Object.entries(garden.emotionalAssociations)
    .filter(([, strength]) => strength < -0.3)
    .map(([location]) => location);

  if (negativeLocations.length > 0) {
    suggestions.push(`avoid_locations:${negativeLocations.join(',')}`);
  }

  // Seek out positive locations
  const positiveLocations = Object.entries(garden.emotionalAssociations)
    .filter(([, strength]) => strength > 0.5)
    .map(([location]) => location);

  if (positiveLocations.length > 0) {
    suggestions.push(`prefer_locations:${positiveLocations.join(',')}`);
  }

  // Time preferences based on successful interactions
  const successfulInteractions = garden.episodicMemories
    .filter(m => m.type === 'interaction' && m.emotional_impact > 0.5);

  if (successfulInteractions.length > 3) {
    const preferredHour = Math.round(
      successfulInteractions.reduce((sum, m) => {
        const hour = new Date(m.timestamp).getHours();
        return sum + hour;
      }, 0) / successfulInteractions.length
    );
    suggestions.push(`preferred_hour:${preferredHour}`);
  }

  // Ritual participation preferences
  const ritualMemories = garden.proceduralMemories
    .filter(m => m.type === 'ritual');

  if (ritualMemories.length > 0) {
    const avgRitualImpact = ritualMemories.reduce((sum, m) => sum + m.emotional_impact, 0) / ritualMemories.length;
    if (avgRitualImpact > 0.3) {
      suggestions.push('ritual_participant:true');
    }
  }

  return suggestions;
}

/**
 * Retrieve relevant memories for context
 */
export function retrieveRelevantMemories(
  garden: CitizenMemoryGarden,
  context: Record<string, any>,
  limit: number = 5
): CitizenMemory[] {
  const allMemories = [
    ...garden.episodicMemories,
    ...garden.semanticMemories,
    ...garden.proceduralMemories
  ];

  // Score memories by relevance to context
  const scoredMemories = allMemories.map(memory => {
    let relevance = 0;

    // Location relevance
    if (context.location && memory.context.location === context.location) {
      relevance += 0.3;
    }

    // Time relevance (recent memories are more relevant)
    const age = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24); // days
    relevance += Math.exp(-age * 0.1); // Exponential decay

    // Emotional relevance
    if (context.emotionalState) {
      const emotionalMatch = 1 - Math.abs(memory.emotional_impact - context.emotionalState);
      relevance += emotionalMatch * 0.2;
    }

    // Content relevance (simple keyword matching)
    if (context.keywords) {
      const contentWords = memory.content.toLowerCase().split(' ');
      const keywordMatches = context.keywords.filter((keyword: string) =>
        contentWords.some(word => word.includes(keyword.toLowerCase()))
      ).length;
      relevance += (keywordMatches / context.keywords.length) * 0.2;
    }

    return { memory, relevance };
  });

  // Return top memories
  return scoredMemories
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit)
    .map(item => item.memory);
}

/**
 * Create initial citizen memory garden
 */
export function createCitizenMemoryGarden(citizenId: string): CitizenMemoryGarden {
  return {
    citizenId,
    episodicMemories: [],
    semanticMemories: [],
    proceduralMemories: [],
    emotionalAssociations: {},
    personalityEvolution: [],
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Save citizen memory garden to database
 */
export async function saveCitizenMemoryGarden(garden: CitizenMemoryGarden): Promise<void> {
  try {
    await supabase.from('citizen_memories').upsert({
      citizen_id: garden.citizenId,
      episodic_memories: garden.episodicMemories,
      semantic_memories: garden.semanticMemories,
      procedural_memories: garden.proceduralMemories,
      emotional_associations: garden.emotionalAssociations,
      personality_evolution: garden.personalityEvolution,
      last_updated: garden.lastUpdated
    });
  } catch (error) {
    ndLog('error','save_memory_garden_failed',{error: String(error), citizenId: garden.citizenId});
  }
}

/**
 * Load citizen memory garden from database
 */
export async function loadCitizenMemoryGarden(citizenId: string): Promise<CitizenMemoryGarden | null> {
  try {
    const { data, error } = await supabase
      .from('citizen_memories')
      .select('*')
      .eq('citizen_id', citizenId)
      .single();

    if (error || !data) return null;

    return {
      citizenId: data.citizen_id,
      episodicMemories: data.episodic_memories || [],
      semanticMemories: data.semantic_memories || [],
      proceduralMemories: data.procedural_memories || [],
      emotionalAssociations: data.emotional_associations || {},
      personalityEvolution: data.personality_evolution || [],
      lastUpdated: data.last_updated
    };
  } catch (error) {
    ndLog('error','load_memory_garden_failed',{error: String(error), citizenId});
    return null;
  }
}

/**
 * Generate memory-based conversation starters
 */
export function generateMemoryBasedConversation(
  citizen: CitizenState,
  garden: CitizenMemoryGarden,
  userId: string
): string[] {
  const starters: string[] = [];

  // Find memories involving this user
  const userMemories = garden.episodicMemories.filter(m =>
    m.context.userId === userId
  );

  if (userMemories.length > 0) {
    const lastInteraction = userMemories[userMemories.length - 1];
    const daysSince = Math.floor((Date.now() - lastInteraction.timestamp) / (1000 * 60 * 60 * 24));

    if (daysSince === 0) {
      starters.push("I remember our conversation from earlier today...");
    } else if (daysSince < 7) {
      starters.push(`It's been ${daysSince} days since we last spoke...`);
    } else {
      starters.push("I have a memory of you from some time ago...");
    }
  }

  // Location-based memories
  const locationMemories = garden.episodicMemories.filter(m =>
    m.context.location && m.emotional_impact > 0.3
  );

  if (locationMemories.length > 0) {
    const favoriteLocation = locationMemories[0].context.location;
    starters.push(`I have fond memories of ${favoriteLocation}...`);
  }

  // Ritual memories
  const ritualMemories = garden.proceduralMemories.filter(m =>
    m.type === 'ritual' && m.emotional_impact > 0.4
  );

  if (ritualMemories.length > 0) {
    starters.push("I participated in a beautiful ritual recently...");
  }

  // Default starters based on personality
  if (citizen.personality.traits.includes('curious')) {
    starters.push("I'm curious about what brings you here today...");
  }

  if (citizen.personality.traits.includes('helpful')) {
    starters.push("Is there anything I can help you with?");
  }

  return starters;
}