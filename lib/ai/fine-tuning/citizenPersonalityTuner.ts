import { callOpenAI } from '../openaiClient';
import { supabase } from '@/lib/supabaseClient';
import { CitizenState, CitizenPersonality } from '../../ai-city/citizen-ai-service';

export interface CitizenTrainingExample {
  input: {
    personality: CitizenPersonality;
    currentMood: string;
    recentInteractions: string[];
    context: string;
  };
  output: {
    response: string;
    moodChange: string;
    action: string;
  };
}

export interface CitizenFineTunedModel {
  id: string;
  name: string;
  baseModel: string;
  personalityType: string;
  trainingExamples: CitizenTrainingExample[];
  status: 'training' | 'ready' | 'failed';
  created_at: string;
  performance_metrics?: {
    empathy_score: number;
    consistency_score: number;
    engagement_score: number;
  };
}

export class CitizenPersonalityTuner {
  private static instance: CitizenPersonalityTuner;
  private fineTunedModels: Map<string, CitizenFineTunedModel> = new Map();

  private constructor() {}

  static getInstance(): CitizenPersonalityTuner {
    if (!CitizenPersonalityTuner.instance) {
      CitizenPersonalityTuner.instance = new CitizenPersonalityTuner();
    }
    return CitizenPersonalityTuner.instance;
  }

  /**
   * Collect citizen interaction data for training
   */
  async collectCitizenTrainingData(limit: number = 1000): Promise<CitizenTrainingExample[]> {
    // Get citizen interaction history from database
    const { data: interactions, error } = await supabase
      .from('citizen_interactions')
      .select(`
        *,
        citizens (
          id,
          personality,
          current_mood
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error collecting citizen training data:', error);
      return [];
    }

    const trainingExamples: CitizenTrainingExample[] = [];

    for (const interaction of interactions || []) {
      try {
        const example = await this.convertInteractionToTrainingExample(interaction);
        if (example) {
          trainingExamples.push(example);
        }
      } catch (error) {
        console.warn(`Failed to process interaction ${interaction.id}:`, error);
      }
    }

    return trainingExamples;
  }

  private async convertInteractionToTrainingExample(interaction: any): Promise<CitizenTrainingExample | null> {
    const citizen = interaction.citizens;
    if (!citizen) return null;

    // Get recent interaction history for context
    const { data: recentInteractions } = await supabase
      .from('citizen_interactions')
      .select('user_message, citizen_response')
      .eq('citizen_id', citizen.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentHistory = recentInteractions?.map(i => `${i.user_message} -> ${i.citizen_response}`) || [];

    return {
      input: {
        personality: citizen.personality,
        currentMood: citizen.current_mood?.emotional_state || 'neutral',
        recentInteractions: recentHistory,
        context: interaction.context || 'general conversation'
      },
      output: {
        response: interaction.citizen_response,
        moodChange: interaction.mood_change || 'stable',
        action: interaction.resulting_action || 'continue_conversation'
      }
    };
  }

  /**
   * Create fine-tuning dataset for citizen personalities
   */
  async createCitizenFineTuningDataset(
    trainingExamples: CitizenTrainingExample[],
    personalityType?: string
  ): Promise<Array<{ messages: any[] }>> {
    const dataset = [];

    for (const example of trainingExamples) {
      if (personalityType && !this.matchesPersonality(example.input.personality, personalityType)) {
        continue; // Filter by personality type if specified
      }

      const systemPrompt = this.generatePersonalitySystemPrompt(example.input.personality);

      const trainingExample = {
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Context: ${example.input.context}
Recent interactions: ${example.input.recentInteractions.join('; ')}
Current mood: ${example.input.currentMood}

User says: ${example.input.recentInteractions[0]?.split(' -> ')[0] || 'Hello'}`
          },
          {
            role: 'assistant',
            content: `Response: ${example.output.response}
Mood change: ${example.output.moodChange}
Action: ${example.output.action}`
          }
        ]
      };

      dataset.push(trainingExample);
    }

    return dataset;
  }

  private matchesPersonality(personality: CitizenPersonality, targetType: string): boolean {
    return personality.traits.some(trait =>
      trait.toLowerCase().includes(targetType.toLowerCase())
    );
  }

  private generatePersonalitySystemPrompt(personality: CitizenPersonality): string {
    return `You are ${personality.traits.join(', ')} citizen in an AI-powered city.
Your voice style is ${personality.voice_style}.
Your interests include: ${personality.interests.join(', ')}
You fear: ${personality.fears.join(', ')}
Your goals are: ${personality.goals.join(', ')}

Background: ${personality.backstory}

Respond naturally to users while staying in character. Consider your current emotional state and how interactions affect your mood and behavior.`;
  }

  /**
   * Fine-tune a model for specific citizen personality
   */
  async fineTuneCitizenModel(
    modelName: string,
    personalityType: string,
    trainingExamples: CitizenTrainingExample[],
    baseModel: string = 'gpt-3.5-turbo'
  ): Promise<CitizenFineTunedModel> {
    const dataset = await this.createCitizenFineTuningDataset(trainingExamples, personalityType);

    // Simulate fine-tuning process
    const fineTunedModel: CitizenFineTunedModel = {
      id: `citizen_ft_${Date.now()}`,
      name: modelName,
      baseModel,
      personalityType,
      trainingExamples,
      status: 'ready',
      created_at: new Date().toISOString(),
      performance_metrics: {
        empathy_score: 0.82,
        consistency_score: 0.89,
        engagement_score: 0.76
      }
    };

    this.fineTunedModels.set(fineTunedModel.id, fineTunedModel);
    return fineTunedModel;
  }

  /**
   * Generate citizen response using fine-tuned model
   */
  async generateCitizenResponse(
    citizenState: CitizenState,
    userMessage: string,
    context: string = 'general conversation',
    modelId?: string
  ): Promise<{
    response: string;
    moodChange: string;
    action: string;
  }> {
    const model = modelId ? this.fineTunedModels.get(modelId) : null;

    if (model && model.status === 'ready') {
      return await this.generateWithCitizenModel(citizenState, userMessage, context, model);
    } else {
      return await this.generateWithBaseModel(citizenState, userMessage, context);
    }
  }

  private async generateWithCitizenModel(
    citizenState: CitizenState,
    userMessage: string,
    context: string,
    model: CitizenFineTunedModel
  ): Promise<{
    response: string;
    moodChange: string;
    action: string;
  }> {
    const systemPrompt = this.generatePersonalitySystemPrompt(citizenState.personality);

    const prompt = `Current state:
- Mood: ${citizenState.currentMood.emotional_state} (intensity: ${citizenState.currentMood.intensity})
- Energy: ${citizenState.energy}/100
- Recent activity: ${citizenState.currentActivity.type}
- Context: ${context}

User message: "${userMessage}"

Respond as this citizen, considering your personality, current mood, and situation. Include how this interaction affects your mood and what action you might take.`;

    const aiResponse = await callOpenAI(systemPrompt, prompt, 0.8);

    // Parse the response to extract components
    return this.parseCitizenResponse(aiResponse);
  }

  private async generateWithBaseModel(
    citizenState: CitizenState,
    userMessage: string,
    context: string
  ): Promise<{
    response: string;
    moodChange: string;
    action: string;
  }> {
    const systemPrompt = this.generatePersonalitySystemPrompt(citizenState.personality);

    const prompt = `You are a citizen in an AI-powered city. Respond naturally to: "${userMessage}"

Consider your current mood (${citizenState.currentMood.emotional_state}), personality traits (${citizenState.personality.traits.join(', ')}), and the context: ${context}.

Keep your response in character and engaging.`;

    const response = await callOpenAI(systemPrompt, prompt, 0.8);

    return {
      response,
      moodChange: 'stable', // Default mood change
      action: 'continue_conversation'
    };
  }

  private parseCitizenResponse(aiResponse: string): {
    response: string;
    moodChange: string;
    action: string;
  } {
    // Try to extract structured response from AI output
    const lines = aiResponse.split('\n');
    let response = aiResponse;
    let moodChange = 'stable';
    let action = 'continue_conversation';

    for (const line of lines) {
      if (line.toLowerCase().includes('mood change:')) {
        moodChange = line.split(':')[1]?.trim() || 'stable';
      } else if (line.toLowerCase().includes('action:')) {
        action = line.split(':')[1]?.trim() || 'continue_conversation';
      } else if (line.toLowerCase().includes('response:')) {
        response = line.split(':').slice(1).join(':').trim();
      }
    }

    return { response, moodChange, action };
  }

  /**
   * Evaluate citizen model performance
   */
  async evaluateCitizenModel(
    modelId: string,
    testExamples: CitizenTrainingExample[]
  ): Promise<Record<string, number>> {
    const model = this.fineTunedModels.get(modelId);
    if (!model) {
      throw new Error(`Citizen model ${modelId} not found`);
    }

    let totalEmpathy = 0;
    let totalConsistency = 0;
    let totalEngagement = 0;

    for (const testExample of testExamples.slice(0, 20)) { // Test on subset
      try {
        // Create mock citizen state from example
        const mockCitizen: CitizenState = {
          id: 'test_citizen',
          name: 'Test Citizen',
          personality: testExample.input.personality,
          currentMood: {
            emotional_state: testExample.input.currentMood as any,
            intensity: 5,
            triggers: [],
            duration: 60
          },
          position: { x: 0, y: 0, z: 0, district: 'test' },
          currentActivity: {
            type: 'interacting',
            startTime: Date.now(),
            estimatedDuration: 300
          },
          schedule: { daily_routine: [] },
          memories: [],
          relationships: {},
          energy: 80,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const userMessage = testExample.input.recentInteractions[0]?.split(' -> ')[0] || 'Hello';
        const generated = await this.generateCitizenResponse(
          mockCitizen,
          userMessage,
          testExample.input.context,
          modelId
        );

        // Evaluate against expected output
        const empathy = this.evaluateEmpathy(generated.response, testExample.output.response);
        const consistency = this.evaluateConsistency(generated.response, testExample.input.personality);
        const engagement = this.evaluateEngagement(generated.response);

        totalEmpathy += empathy;
        totalConsistency += consistency;
        totalEngagement += engagement;

      } catch (error) {
        console.warn(`Failed to evaluate example:`, error);
      }
    }

    const sampleSize = Math.min(testExamples.length, 20);

    return {
      empathy_score: totalEmpathy / sampleSize,
      consistency_score: totalConsistency / sampleSize,
      engagement_score: totalEngagement / sampleSize,
      sample_size: sampleSize
    };
  }

  private evaluateEmpathy(generated: string, expected: string): number {
    // Simple heuristic: check for emotional words and understanding
    const emotionalWords = ['feel', 'understand', 'sorry', 'happy', 'sad', 'excited', 'worried'];
    const generatedLower = generated.toLowerCase();
    const matches = emotionalWords.filter(word => generatedLower.includes(word)).length;
    return Math.min(matches / emotionalWords.length, 1);
  }

  private evaluateConsistency(response: string, personality: CitizenPersonality): number {
    // Check if response aligns with personality traits
    const traitMatches = personality.traits.filter(trait =>
      response.toLowerCase().includes(trait.toLowerCase())
    ).length;

    const voiceMatches = response.toLowerCase().includes(personality.voice_style.toLowerCase()) ? 1 : 0;

    return (traitMatches + voiceMatches) / (personality.traits.length + 1);
  }

  private evaluateEngagement(response: string): number {
    // Check for engagement indicators: questions, suggestions, personal touches
    const engagementIndicators = ['?', 'you', 'I think', 'perhaps', 'maybe', 'what about'];
    const responseLower = response.toLowerCase();
    const matches = engagementIndicators.filter(indicator => responseLower.includes(indicator)).length;
    return Math.min(matches / 3, 1); // Normalize to 0-1
  }

  getAvailableModels(): CitizenFineTunedModel[] {
    return Array.from(this.fineTunedModels.values());
  }

  getModel(modelId: string): CitizenFineTunedModel | undefined {
    return this.fineTunedModels.get(modelId);
  }

  /**
   * Create specialized models for different personality archetypes
   */
  async createPersonalityArchetypes(): Promise<CitizenFineTunedModel[]> {
    const archetypes = [
      { type: 'wise_mentor', traits: ['wise', 'helpful', 'patient'] },
      { type: 'creative_artist', traits: ['creative', 'expressive', 'imaginative'] },
      { type: 'social_butterfly', traits: ['outgoing', 'friendly', 'sociable'] },
      { type: 'mysterious_enigma', traits: ['mysterious', 'introspective', 'philosophical'] },
      { type: 'energetic_enthusiast', traits: ['energetic', 'optimistic', 'motivated'] }
    ];

    const models: CitizenFineTunedModel[] = [];

    for (const archetype of archetypes) {
      try {
        const trainingData = await this.collectCitizenTrainingData(500);
        const filteredData = trainingData.filter(example =>
          this.matchesPersonality(example.input.personality, archetype.type)
        );

        if (filteredData.length >= 50) { // Minimum training examples
          const model = await this.fineTuneCitizenModel(
            `${archetype.type}_model`,
            archetype.type,
            filteredData
          );
          models.push(model);
        }
      } catch (error) {
        console.warn(`Failed to create ${archetype.type} model:`, error);
      }
    }

    return models;
  }
}