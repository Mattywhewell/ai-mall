import Anthropic from '@anthropic-ai/sdk';

let anthropicClient: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    anthropicClient = new Anthropic({
      apiKey,
    });
  }
  return anthropicClient;
}

export async function callAnthropic(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7,
  model: string = 'claude-3-5-sonnet-20241022'
): Promise<string> {
  try {
    const client = getAnthropic();
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      temperature,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (error) {
    console.error('Anthropic API Error:', error);
    throw new Error('Failed to generate AI content with Anthropic');
  }
}

export async function generateAnthropicEmbedding(text: string): Promise<number[]> {
  // Anthropic doesn't have embedding models yet, so we'll use OpenAI for embeddings
  // This is a temporary solution until Anthropic releases embeddings
  const { generateEmbedding } = await import('./openaiClient');
  return generateEmbedding(text);
}