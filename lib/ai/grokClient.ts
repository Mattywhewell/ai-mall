// Grok API Client (xAI)
// Note: This is a placeholder implementation. xAI may have different API endpoints and authentication

interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

let grokApiKey: string | null = null;

export function getGrokApiKey(): string {
  if (!grokApiKey) {
    grokApiKey = process.env.GROK_API_KEY || '';
    if (!grokApiKey) {
      throw new Error('GROK_API_KEY environment variable is required');
    }
  }
  return grokApiKey;
}

export async function callGrok(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7,
  model: string = 'grok-beta'
): Promise<string> {
  try {
    const apiKey = getGrokApiKey();

    // Grok API endpoint (this may change based on xAI's actual API)
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
    }

    const data: GrokResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Grok API Error:', error);
    throw new Error('Failed to generate AI content with Grok');
  }
}

export async function generateGrokEmbedding(text: string): Promise<number[]> {
  // Grok doesn't have embedding models yet, fallback to OpenAI
  const { generateEmbedding } = await import('./openaiClient');
  return generateEmbedding(text);
}