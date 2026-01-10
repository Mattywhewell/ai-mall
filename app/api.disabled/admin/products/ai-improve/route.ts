/**
 * POST /api/admin/products/ai-improve
 * Use AI to improve product description, title, and other content
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { productData } = await request.json();

    if (!productData) {
      return NextResponse.json(
        { error: 'Product data is required' },
        { status: 400 }
      );
    }

    const client = getOpenAI();

    // Improve the description
    const descriptionPrompt = `Improve this product description to be more engaging, highlight key benefits, and be optimized for e-commerce:

Original: "${productData.description}"

Make it:
- More compelling and benefit-focused
- Professional but conversational
- SEO-friendly with natural keywords
- Around 150-200 words
- Include emotional benefits

Return only the improved description, no quotes or formatting.`;

    const descriptionResponse = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional e-commerce copywriter who creates compelling product descriptions.'
        },
        {
          role: 'user',
          content: descriptionPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    const improvedDescription = descriptionResponse.choices[0].message.content?.trim() || productData.description;

    // Improve the title
    const titlePrompt = `Improve this product title to be more compelling and SEO-friendly:

Original: "${productData.title}"

Make it:
- More descriptive and benefit-focused
- Include key features or selling points
- Natural and readable
- Under 60 characters if possible

Return only the improved title, no quotes.`;

    const titleResponse = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at writing compelling product titles for e-commerce.'
        },
        {
          role: 'user',
          content: titlePrompt
        }
      ],
      temperature: 0.6,
      max_tokens: 100
    });

    const improvedTitle = titleResponse.choices[0].message.content?.trim() || productData.title;

    // Generate better tags
    const tagsPrompt = `Generate 5-8 relevant SEO tags for this product:

Title: ${improvedTitle}
Description: ${improvedDescription}
Category: ${productData.category}

Tags should be:
- Specific and relevant
- Include long-tail keywords
- Mix of popular and niche terms
- Lowercase, hyphenated if needed

Return as comma-separated list.`;

    const tagsResponse = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert who creates relevant product tags.'
        },
        {
          role: 'user',
          content: tagsPrompt
        }
      ],
      temperature: 0.5,
      max_tokens: 150
    });

    const tagsText = tagsResponse.choices[0].message.content?.trim() || '';
    const improvedTags = tagsText.split(',').map((tag: string) => tag.trim().toLowerCase()).filter(Boolean);

    // Combine existing tags with new ones, remove duplicates
    const allTags = [...(productData.tags || []), ...improvedTags];
    const uniqueTags = [...new Set(allTags)].slice(0, 10);

    // Return improved data
    const improvedData = {
      ...productData,
      title: improvedTitle,
      description: improvedDescription,
      tags: uniqueTags
    };

    return NextResponse.json({
      success: true,
      improvedData,
      changes: {
        title: improvedTitle !== productData.title,
        description: improvedDescription !== productData.description,
        tags: uniqueTags.length !== (productData.tags?.length || 0)
      }
    });

  } catch (error) {
    console.error('AI improve error:', error);
    return NextResponse.json(
      { error: 'Failed to improve product with AI' },
      { status: 500 }
    );
  }
}