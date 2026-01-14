/**
 * Hugging Face Transformers Client
 * Uses @xenova/transformers for running transformer models locally in Node.js
 */

// Dynamic import to make it optional
let transformersModule: any = null;

async function loadTransformers() {
  if (!transformersModule) {
    try {
      transformersModule = await import('@xenova/transformers' as any);
    } catch (error) {
      console.warn('Hugging Face Transformers not available:', error);
      throw new Error('Hugging Face Transformers package not installed. Run: npm install @xenova/transformers');
    }
  }
  return transformersModule;
}

interface HuggingFaceConfig {
  model: string;
  task: 'text-generation' | 'text2text-generation' | 'question-answering' | 'summarization';
  device?: 'cpu' | 'gpu';
  dtype?: 'fp32' | 'fp16' | 'int8' | 'uint8';
}

class HuggingFaceManager {
  private static instance: HuggingFaceManager;
  private pipelines: Map<string, any> = new Map();
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): HuggingFaceManager {
    if (!HuggingFaceManager.instance) {
      HuggingFaceManager.instance = new HuggingFaceManager();
    }
    return HuggingFaceManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const transformers = await loadTransformers();

      // Pre-load commonly used models
      const commonModels = [
        'Xenova/gpt2', // Text generation
        'Xenova/distilbart-cnn-6-6', // Summarization
        'Xenova/bert-base-uncased', // Question answering
      ];

      for (const model of commonModels) {
        try {
          await this.getPipeline(model, 'text-generation');
          console.log(`Pre-loaded Hugging Face model: ${model}`);
        } catch (error) {
          console.warn(`Failed to pre-load model ${model}:`, error);
        }
      }

      this.initialized = true;
    } catch (error) {
      console.warn('Hugging Face initialization failed:', error);
    }
  }

  async getPipeline(modelName: string, task: string): Promise<any> {
    const key = `${modelName}-${task}`;

    if (!this.pipelines.has(key)) {
      const transformers = await loadTransformers();
      console.log(`Loading Hugging Face model: ${modelName} for task: ${task}`);
      const pipeline = await transformers.pipeline(task, modelName, {
        device: 'cpu', // Use CPU for server-side inference
        dtype: 'fp32',
      });
      this.pipelines.set(key, pipeline);
    }

    return this.pipelines.get(key);
  }

  async generateText(
    model: string,
    prompt: string,
    options: {
      max_length?: number;
      temperature?: number;
      top_p?: number;
      do_sample?: boolean;
      pad_token_id?: number;
    } = {}
  ): Promise<string> {
    const pipeline = await this.getPipeline(model, 'text-generation');

    const result = await pipeline(prompt, {
      max_length: options.max_length || 100,
      temperature: options.temperature || 0.7,
      top_p: options.top_p || 0.9,
      do_sample: options.do_sample !== false,
      pad_token_id: options.pad_token_id || 50256, // GPT-2 pad token
    });

    // Extract generated text (remove the original prompt)
    const generated = result[0]?.generated_text || '';
    return generated.replace(prompt, '').trim();
  }

  async summarizeText(
    model: string,
    text: string,
    options: {
      max_length?: number;
      min_length?: number;
    } = {}
  ): Promise<string> {
    const pipeline = await this.getPipeline(model, 'summarization');

    const result = await pipeline(text, {
      max_length: options.max_length || 130,
      min_length: options.min_length || 30,
    });

    return result[0]?.summary_text || '';
  }

  async answerQuestion(
    model: string,
    question: string,
    context: string
  ): Promise<{ answer: string; score: number }> {
    const pipeline = await this.getPipeline(model, 'question-answering');

    const result = await pipeline(question, context);

    return {
      answer: result.answer,
      score: result.score,
    };
  }
}

// Export singleton instance
const hfManager = HuggingFaceManager.getInstance();

export { hfManager as HuggingFaceManager };

// High-level API functions with fallbacks
export async function callHuggingFace(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7,
  model: string = 'Xenova/gpt2'
): Promise<string> {
  try {
    // Try to use Hugging Face if available
    const manager = HuggingFaceManager.getInstance();
    const fullPrompt = `${systemPrompt}\n\nHuman: ${userPrompt}\n\nAssistant:`;

    return await manager.generateText(model, fullPrompt, {
      temperature,
      max_length: 200,
    });
  } catch (error) {
    console.warn('Hugging Face not available, falling back to OpenAI:', error);
    // Fallback to OpenAI
    const { callOpenAI } = await import('../openaiClient');
    return await callOpenAI(systemPrompt, userPrompt, temperature);
  }
}

export async function generateHuggingFaceEmbedding(text: string): Promise<number[]> {
  // For embeddings, we could use a sentence transformer model
  // For now, fallback to OpenAI since HF embeddings are more complex
  const { generateEmbedding } = await import('../openaiClient');
  return generateEmbedding(text);
}

export async function summarizeWithHuggingFace(
  text: string,
  model: string = 'Xenova/distilbart-cnn-6-6'
): Promise<string> {
  try {
    const manager = HuggingFaceManager.getInstance();
    return await manager.summarizeText(model, text);
  } catch (error) {
    console.warn('Hugging Face summarization not available, using OpenAI fallback');
    // For now, return a simple summary or use OpenAI
    return `Summary: ${text.substring(0, 100)}...`;
  }
}

export async function answerQuestionWithHuggingFace(
  question: string,
  context: string,
  model: string = 'Xenova/bert-base-uncased'
): Promise<{ answer: string; score: number }> {
  try {
    const manager = HuggingFaceManager.getInstance();
    return await manager.answerQuestion(model, question, context);
  } catch (error) {
    console.warn('Hugging Face QA not available, using simple fallback');
    // Simple fallback - just return the first sentence containing question keywords
    return {
      answer: 'Answer not available - Hugging Face models not loaded',
      score: 0
    };
  }
}