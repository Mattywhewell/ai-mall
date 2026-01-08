import { callOpenAI } from './openaiClient';

export interface ProductDescriptionResult {
  longDescription: string;
  shortDescription: string;
  seoKeywords: string[];
  tone: string;
}

export async function generateProductDescription(
  productName: string,
  category: string,
  districtTheme: string
): Promise<ProductDescriptionResult> {
  const systemPrompt = `You are a creative copywriter specializing in e-commerce product descriptions. 
Your task is to create compelling, tone-matched product descriptions that align with the district theme.
Return your response as a valid JSON object with the following structure:
{
  "longDescription": "2-3 paragraphs describing the product in detail",
  "shortDescription": "1-2 sentences summarizing the product",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "tone": "description of the tone used (e.g., 'playful', 'professional', 'luxurious')"
}`;

  const userPrompt = `Generate product descriptions for:
Product Name: ${productName}
Category: ${category}
District Theme: ${districtTheme}

Match the tone and style to the district theme. For example:
- Tech District: Modern, innovative, cutting-edge
- Fashion District: Stylish, trendy, elegant
- Food District: Delicious, appetizing, artisanal
- Eco District: Sustainable, natural, eco-friendly

Return ONLY the JSON object, no additional text.`;

  const response = await callOpenAI(systemPrompt, userPrompt, 0.8);
  
  try {
    const parsed = JSON.parse(response);
    return {
      longDescription: parsed.longDescription || '',
      shortDescription: parsed.shortDescription || '',
      seoKeywords: parsed.seoKeywords || [],
      tone: parsed.tone || 'neutral',
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Invalid AI response format');
  }
}

// Export alias for backward compatibility
export const generateAIDescription = generateProductDescription;
