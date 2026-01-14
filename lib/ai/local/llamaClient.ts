import { OllamaManager } from './ollamaManager';

export async function callLlama(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7,
  model: string = 'llama3.1'
): Promise<string> {
  try {
    const ollama = OllamaManager.getInstance();
    const fullPrompt = `${systemPrompt}\n\nHuman: ${userPrompt}\n\nAssistant:`;

    return await ollama.callModel(model, fullPrompt, {
      temperature,
      max_tokens: 2048,
    });
  } catch (error) {
    console.error('Llama API Error:', error);
    throw new Error('Failed to generate AI content with Llama');
  }
}

export async function generateLlamaEmbedding(text: string): Promise<number[]> {
  // Local models typically don't have embedding capabilities
  // We'll use a simple hash-based approach or fall back to OpenAI
  // For production, you'd want to use a proper embedding model

  // Simple fallback - use OpenAI for embeddings
  const { generateEmbedding } = await import('../openaiClient');
  return generateEmbedding(text);
}

export async function ensureLlamaModel(modelName: string = 'llama3.1'): Promise<void> {
  const ollama = OllamaManager.getInstance();

  if (!ollama.isModelAvailable(modelName)) {
    console.log(`Llama model ${modelName} not available, attempting to pull...`);
    try {
      await ollama.pullModel(modelName);
    } catch (error) {
      console.error(`Failed to pull Llama model ${modelName}:`, error);
      throw new Error(`Could not load Llama model ${modelName}. Please ensure Ollama is running and the model is available.`);
    }
  }
}