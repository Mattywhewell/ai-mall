/**
 * API Route: District Evolution
 * GET /api/autonomous/districts/[slug] - Get district evolution status
 * POST /api/autonomous/districts/[slug]/evolve - Trigger district evolution
 */

import { NextResponse } from 'next/server';
import { DistrictEvolution } from '@/lib/autonomous/district-evolution';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const success = await DistrictEvolution.evolveDistrict(slug);

    if (success) {
      return NextResponse.json({ message: 'District evolved successfully' });
    } else {
      return NextResponse.json(
        { error: 'Evolution failed' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Get suggested categories
    const categories = await DistrictEvolution.suggestCategories(slug);
    
    // Generate marketing content
    const marketing = await DistrictEvolution.generateMarketingContent(slug);

    return NextResponse.json({
      suggested_categories: categories,
      marketing_content: marketing,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
