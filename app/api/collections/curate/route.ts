import { NextResponse } from 'next/server';
import { collectionCurator } from '@/lib/ai-city/collection-curator';

/**
 * POST /api/collections/curate
 * Trigger AI to curate a new collection
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { theme, userId } = body;

    // If userId provided, generate personalized collection
    if (userId) {
      const collectionId = await collectionCurator.generatePersonalizedCollection(userId);

      if (!collectionId) {
        return NextResponse.json(
          { error: 'Failed to generate personalized collection. User may not have enough activity data.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        collectionId,
        message: 'Personalized collection created'
      });
    }

    // Auto-curate collections based on trends and seasons
    if (!theme || theme === 'auto') {
      const collectionIds = await collectionCurator.autoCurateCollections();

      return NextResponse.json({
        success: true,
        collectionIds,
        count: collectionIds.length,
        message: `Created ${collectionIds.length} AI-curated collections`
      });
    }

    // Curate specific theme
    const themeConfig: any = {
      wellness: {
        name: 'Wellness Essentials',
        slug: `wellness-essentials-${Date.now()}`,
        description: 'Mindfully curated products for your wellbeing journey',
        theme: 'wellness',
        curatorPersonality: 'Serenity - The Chapel Spirit of Calm',
        targetMood: 'peaceful'
      },
      tech: {
        name: 'Tech Innovator\'s Arsenal',
        slug: `tech-arsenal-${Date.now()}`,
        description: 'Cutting-edge tools for makers and creators',
        theme: 'tech',
        curatorPersonality: 'Prometheus - Innovation Hall Spirit',
        targetPersona: 'tech enthusiast'
      },
      seasonal: {
        name: `Seasonal Favorites`,
        slug: `seasonal-${Date.now()}`,
        description: 'Perfect picks for this season',
        theme: 'seasonal',
        curatorPersonality: 'Seasonal Curator AI'
      }
    };

    const config = themeConfig[theme];
    if (!config) {
      return NextResponse.json(
        { error: `Invalid theme. Choose from: ${Object.keys(themeConfig).join(', ')}` },
        { status: 400 }
      );
    }

    const collectionId = await collectionCurator.curateCollection(config);

    if (!collectionId) {
      return NextResponse.json(
        { error: 'Failed to curate collection. Not enough matching products found.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      collectionId,
      theme,
      message: `Created ${theme} collection`
    });
  } catch (error: any) {
    console.error('Error curating collection:', error);
    return NextResponse.json(
      { error: 'Failed to curate collection', details: error.message },
      { status: 500 }
    );
  }
}
