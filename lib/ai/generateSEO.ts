import { callOpenAI } from './openaiClient';

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
}

export async function generateSEOMetadata(
  pageName: string,
  content: string,
  context: string
): Promise<SEOMetadata> {
  const systemPrompt = `You are an SEO expert. Generate optimized metadata for web pages.
Return your response as a valid JSON object with the following structure:
{
  "title": "SEO-optimized title (50-60 characters)",
  "description": "Meta description (150-160 characters)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "ogTitle": "Open Graph title for social sharing",
  "ogDescription": "Open Graph description for social sharing"
}

Make sure titles and descriptions are compelling and include relevant keywords naturally.
Return ONLY the JSON object, no additional text.`;

  const userPrompt = `Generate SEO metadata for:
Page Name: ${pageName}
Content: ${content}
Context: ${context}`;

  const response = await callOpenAI(systemPrompt, userPrompt, 0.6);
  
  try {
    const parsed = JSON.parse(response);
    return {
      title: parsed.title || pageName,
      description: parsed.description || '',
      keywords: parsed.keywords || [],
      ogTitle: parsed.ogTitle || parsed.title || pageName,
      ogDescription: parsed.ogDescription || parsed.description || '',
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Invalid AI response format');
  }
}
