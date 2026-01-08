import { callOpenAI } from './openaiClient';

export interface SocialMediaAssets {
  tiktokHook: string;
  instagramCaption: string;
  tweet: string;
  hashtags: string[];
}

export async function generateSocialMediaAssets(
  productName: string,
  description: string,
  districtTheme: string
): Promise<SocialMediaAssets> {
  const systemPrompt = `You are a social media marketing expert. Create engaging social media content for products.
Return your response as a valid JSON object with the following structure:
{
  "tiktokHook": "Attention-grabbing TikTok hook (1-2 sentences, casual, engaging)",
  "instagramCaption": "Instagram caption with emojis (2-3 sentences)",
  "tweet": "Twitter/X post (under 280 characters, engaging)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

Make content platform-appropriate:
- TikTok: Casual, trendy, attention-grabbing
- Instagram: Visual, lifestyle-focused, emoji-rich
- Twitter: Concise, witty, engaging
- Hashtags: Trending and relevant (without # symbol)

Return ONLY the JSON object, no additional text.`;

  const userPrompt = `Generate social media content for:
Product Name: ${productName}
Description: ${description}
District Theme: ${districtTheme}`;

  const response = await callOpenAI(systemPrompt, userPrompt, 0.9);
  
  try {
    const parsed = JSON.parse(response);
    return {
      tiktokHook: parsed.tiktokHook || '',
      instagramCaption: parsed.instagramCaption || '',
      tweet: parsed.tweet || '',
      hashtags: parsed.hashtags || [],
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Invalid AI response format');
  }
}
