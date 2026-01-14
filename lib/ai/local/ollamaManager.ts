import { Ollama } from 'ollama';

export interface LocalModelConfig {
  name: string;
  model: string;
  parameters?: Record<string, any>;
}

export class OllamaManager {
  private static instance: OllamaManager;
  private availableModels: string[] = [];
  private ollama: Ollama;

  private constructor() {
    this.ollama = new Ollama();
  }

  static getInstance(): OllamaManager {
    if (!OllamaManager.instance) {
      OllamaManager.instance = new OllamaManager();
    }
    return OllamaManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Check if Ollama is running and get available models
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        const data = await response.json();
        this.availableModels = data.models?.map((m: any) => m.name) || [];
        console.log('Available Ollama models:', this.availableModels);
      }
    } catch (error) {
      console.warn('Ollama not available:', error);
    }
  }

  isModelAvailable(modelName: string): boolean {
    return this.availableModels.includes(modelName);
  }

  async callModel(
    model: string,
    prompt: string,
    options: {
      temperature?: number;
      max_tokens?: number;
      system?: string;
    } = {}
  ): Promise<string> {
    try {
      if (!this.isModelAvailable(model)) {
        throw new Error(`Model ${model} not available in Ollama`);
      }

      const response = await this.ollama.generate({
        model,
        prompt: options.system ? `${options.system}\n\n${prompt}` : prompt,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.max_tokens || 2048,
        },
      });

      return response.response;
    } catch (error) {
      console.error('Ollama API Error:', error);
      throw new Error(`Failed to generate content with Ollama model ${model}`);
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        const data = await response.json();
        return data.models?.map((m: any) => m.name) || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to list Ollama models:', error);
      return [];
    }
  }

  async pullModel(modelName: string): Promise<void> {
    try {
      console.log(`Pulling Ollama model: ${modelName}`);
      await this.ollama.pull({ model: modelName });
      console.log(`Successfully pulled model: ${modelName}`);
    } catch (error) {
      console.error(`Failed to pull model ${modelName}:`, error);
      throw error;
    }
  }
}

// Export a convenience function for calling local models
export async function callLocalModel(
  model: string,
  systemPrompt: string,
  prompt: string,
  options: {
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<string> {
  const manager = OllamaManager.getInstance();
  return manager.callModel(model, prompt, {
    system: systemPrompt,
    ...options
  });
}