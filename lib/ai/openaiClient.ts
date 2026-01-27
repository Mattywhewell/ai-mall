import { getOpenAI } from '../openai';
import { log as ndLog, timeAsync } from '@/lib/server-ndjson';

export async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<string> {
  // Wrap the OpenAI call so we emit ai_request timing and errors
  const fn = async () => {
    const client = getOpenAI();
    const response = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
    });

    return response.choices[0]?.message?.content || '';
  };

  try {
    const res = await timeAsync('openai.chat.completions', fn, { promptSnippet: systemPrompt.slice(0, 120) });
    return res as string;
  } catch (error) {
    ndLog('error','ai_request_failed',{systemSnippet: systemPrompt.slice(0,120), error: String(error)});
    throw new Error('Failed to generate AI content');
  }
} 

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const res = await timeAsync('openai.embeddings', async () => {
      const client = getOpenAI();
      const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    }, { textSnippet: text.slice(0, 120) });

    return res as number[];
  } catch (error) {
    ndLog('error','ai_embedding_failed',{error: String(error)});
    throw new Error('Failed to generate embedding');
  }
} 
