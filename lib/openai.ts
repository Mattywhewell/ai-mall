import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (openaiClient) return openaiClient;
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  openaiClient = new OpenAI({ apiKey: key });
  return openaiClient;
}

export function getOpenAIOrNull(): OpenAI | null {
  try {
    return getOpenAI();
  } catch (err) {
    return null;
  }
}
