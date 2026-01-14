import { OllamaManager } from './ollamaManager';

export async function callMistral(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7,
  model: string = 'mistral'
): Promise<string> {
  try {
    const ollama = OllamaManager.getInstance();
    const fullPrompt = `${systemPrompt}\n\nHuman: ${userPrompt}\n\nAssistant:`;

    return await ollama.callModel(model, fullPrompt, {
      temperature,
      max_tokens: 2048,
    });
  } catch (error) {
    console.error('Mistral API Error:', error);
    throw new Error('Failed to generate AI content with Mistral');
  }
}

export async function generateMistralEmbedding(text: string): Promise<number[]> {
  // Local models typically don't have embedding capabilities
  // Fallback to OpenAI for embeddings
  const { generateEmbedding } = await import('../openaiClient');
  return generateEmbedding(text);
}

export async function ensureMistralModel(modelName: string = 'mistral'): Promise<void> {
  const ollama = OllamaManager.getInstance();

  if (!ollama.isModelAvailable(modelName)) {
    console.log(`Mistral model ${modelName} not available, attempting to pull...`);
    try {
      await ollama.pullModel(modelName);
    } catch (error) {
      console.error(`Failed to pull Mistral model ${modelName}:`, error);
      throw new Error(`Could not load Mistral model ${modelName}. Please ensure Ollama is running and the model is available.`);
    }
  }
}