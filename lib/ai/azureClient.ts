// Azure OpenAI Client Integration
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';

let azureClient: OpenAIClient | null = null;

export function getAzureOpenAI(): OpenAIClient | null {
  if (!azureClient) {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';

    if (!apiKey || !endpoint) {
      console.warn('Azure OpenAI not configured - missing API key or endpoint');
      return null;
    }

    try {
      const credential = new AzureKeyCredential(apiKey);
      azureClient = new OpenAIClient(endpoint, credential);
    } catch (error) {
      console.error('Failed to initialize Azure OpenAI client:', error);
      return null;
    }
  }
  return azureClient;
}

export async function callAzureOpenAI(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<string> {
  try {
    const client = getAzureOpenAI();
    if (!client) {
      throw new Error('Azure OpenAI client not available');
    }

    // For Azure OpenAI, use deployment name from environment
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await client.getChatCompletions(deployment, messages, {
      temperature,
      maxTokens: 4096,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Azure OpenAI API Error:', error);
    throw new Error('Failed to generate AI content with Azure OpenAI');
  }
}

export async function generateAzureEmbedding(text: string): Promise<number[]> {
  try {
    const client = getAzureOpenAI();
    if (!client) {
      throw new Error('Azure OpenAI client not available');
    }

    // Use embedding deployment - typically different from chat deployment
    const embeddingDeployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-ada-002';

    const response = await client.getEmbeddings(embeddingDeployment, [text]);

    return response.data[0].embedding;
  } catch (error) {
    console.error('Azure OpenAI Embedding Error:', error);
    throw new Error('Failed to generate embedding with Azure OpenAI');
  }
}