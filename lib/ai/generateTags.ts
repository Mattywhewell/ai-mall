import { callOpenAI } from './openaiClient';

export async function generateProductTags(
  productName: string,
  description: string,
  districtTheme: string
): Promise<string[]> {
  const systemPrompt = `You are a product tagging expert. Generate relevant, searchable tags for products.
Return your response as a valid JSON array of strings.
Generate 5-10 tags that are:
- Descriptive and specific
- Relevant to the product
- Aligned with the district theme
- Useful for search and categorization

Return ONLY the JSON array, no additional text.
Example: ["tag1", "tag2", "tag3"]`;

  const userPrompt = `Generate tags for:
Product Name: ${productName}
Description: ${description}
District Theme: ${districtTheme}`;

  const response = await callOpenAI(systemPrompt, userPrompt, 0.7);
  
  try {
    const parsed = JSON.parse(response);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return [];
  }
}
