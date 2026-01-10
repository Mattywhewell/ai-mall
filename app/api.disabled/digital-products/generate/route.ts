import { NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { getSupabaseClient } from '@/lib/supabase-server';

const openai = { chat: { completions: { create: (...args: any[]) => getOpenAI().chat.completions.create(...args) } } };

export async function POST(request: Request) {
  try {
    const { 
      type, 
      category, 
      prompt, 
      customization 
    } = await request.json();

    // Generate AI content based on type
    let generatedProduct;

    switch (type) {
      case 'template':
        generatedProduct = await generateTemplate(prompt, category, customization);
        break;
      case 'brand_kit':
        generatedProduct = await generateBrandKit(prompt, customization);
        break;
      case 'guide':
        generatedProduct = await generateGuide(prompt, category);
        break;
      case 'ritual_kit':
        generatedProduct = await generateRitualKit(prompt);
        break;
      case 'bundle':
        generatedProduct = await generateBundle(category, customization);
        break;
      default:
        return NextResponse.json({ error: 'Invalid product type' }, { status: 400 });
    }

    // Store in database
    const supabase = getSupabaseClient();
    const { data: product, error } = await supabase
      .from('digital_products')
      .insert({
        ...generatedProduct,
        type,
        category,
        status: 'active',
        visibility: 'public',
        generated_by: 'ai_engine',
        generation_prompt: prompt,
        generation_model: 'gpt-4o',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      product 
    });

  } catch (error: any) {
    console.error('Digital product generation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function generateTemplate(prompt: string, category: string, customization: any) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'system',
      content: `You are an expert template designer for ${category}. Create professional, actionable templates.`
    }, {
      role: 'user',
      content: `Create a detailed template for: ${prompt}\n\nCustomization: ${JSON.stringify(customization)}\n\nProvide:\n1. Title\n2. Description\n3. Sections with instructions\n4. Fillable fields\n5. Example content\n\nReturn as JSON with: {title, description, price, sections, fields}`
    }],
    response_format: { type: 'json_object' },
  });

  const template = JSON.parse(completion.choices[0].message.content!);
  
  return {
    title: template.title,
    description: template.description,
    price: template.price || 29.99,
    content_url: await uploadContent(template, 'template'),
    thumbnail_url: await generateThumbnail(template.title, 'template'),
    file_format: 'pdf',
    tags: [category, 'template', 'ai-generated'],
  };
}

async function generateBrandKit(prompt: string, customization: any) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'system',
      content: 'You are a brand strategist creating comprehensive brand kits with positioning, voice, visuals, and messaging.'
    }, {
      role: 'user',
      content: `Create a complete brand kit for: ${prompt}\n\nCustomization: ${JSON.stringify(customization)}\n\nInclude:\n1. Brand positioning\n2. Voice & tone guide\n3. Color palette (hex codes)\n4. Typography recommendations\n5. Logo concepts (text descriptions)\n6. Tagline options\n7. Messaging framework\n8. Social media templates\n\nReturn as JSON with: {title, description, price, brand_positioning, voice_guide, colors, typography, logos, taglines, messaging, social_templates}`
    }],
    response_format: { type: 'json_object' },
  });

  const brandKit = JSON.parse(completion.choices[0].message.content!);
  
  return {
    title: brandKit.title || `${customization?.business_name || 'Custom'} Brand Kit`,
    description: brandKit.description,
    price: brandKit.price || 99.99,
    content_url: await uploadContent(brandKit, 'brand_kit'),
    thumbnail_url: await generateThumbnail(brandKit.title, 'brand'),
    file_format: 'zip',
    tags: ['branding', 'brand-kit', 'identity', 'ai-generated'],
  };
}

async function generateGuide(prompt: string, category: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'system',
      content: `You are an expert guide writer for ${category}. Create comprehensive, step-by-step guides with actionable advice.`
    }, {
      role: 'user',
      content: `Create a detailed guide for: ${prompt}\n\nInclude:\n1. Introduction\n2. Prerequisites\n3. Step-by-step instructions (minimum 7 steps)\n4. Pro tips for each step\n5. Common pitfalls to avoid\n6. Resources and tools\n7. Next steps\n\nReturn as JSON with: {title, description, price, introduction, prerequisites, steps, tips, pitfalls, resources}`
    }],
    response_format: { type: 'json_object' },
  });

  const guide = JSON.parse(completion.choices[0].message.content!);
  
  return {
    title: guide.title,
    description: guide.description,
    price: guide.price || 19.99,
    content_url: await uploadContent(guide, 'guide'),
    thumbnail_url: await generateThumbnail(guide.title, 'guide'),
    file_format: 'pdf',
    tags: [category, 'guide', 'how-to', 'ai-generated'],
  };
}

async function generateRitualKit(prompt: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'system',
      content: 'You are a ritual designer creating meaningful, practical rituals that blend ancient wisdom with modern life.'
    }, {
      role: 'user',
      content: `Create a ritual kit for: ${prompt}\n\nInclude:\n1. Ritual name and purpose\n2. What you'll need (supplies/items)\n3. When to perform (timing/frequency)\n4. Step-by-step instructions\n5. Invocations or affirmations\n6. Journaling prompts\n7. Integration practices\n\nReturn as JSON with: {title, description, price, purpose, supplies, timing, steps, invocations, journaling, integration}`
    }],
    response_format: { type: 'json_object' },
  });

  const ritual = JSON.parse(completion.choices[0].message.content!);
  
  return {
    title: ritual.title,
    description: ritual.description,
    price: ritual.price || 14.99,
    content_url: await uploadContent(ritual, 'ritual'),
    thumbnail_url: await generateThumbnail(ritual.title, 'ritual'),
    file_format: 'pdf',
    tags: ['ritual', 'spiritual', 'practice', 'ai-generated'],
  };
}

async function generateBundle(category: string, customization: any) {
  // Get existing products in category
  const { data: existingProducts } = await supabase
    .from('products')
    .select('id, title, description, price')
    .eq('category', category)
    .limit(20);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'system',
      content: `You are a product curator creating high-value bundles for ${category}.`
    }, {
      role: 'user',
      content: `Create a themed bundle for ${category}.\n\nAvailable products: ${JSON.stringify(existingProducts)}\n\nCreate:\n1. Bundle theme and name\n2. Why these products work together\n3. Bundle price (20% discount from individual)\n4. Marketing description\n5. Who it's perfect for\n\nReturn as JSON with: {title, description, theme, value_proposition, product_ids, individual_price, bundle_price, target_customer}`
    }],
    response_format: { type: 'json_object' },
  });

  const bundle = JSON.parse(completion.choices[0].message.content!);
  
  return {
    title: bundle.title,
    description: bundle.description,
    price: bundle.bundle_price || 49.99,
    content_url: await uploadContent(bundle, 'bundle'),
    thumbnail_url: await generateThumbnail(bundle.title, 'bundle'),
    file_format: 'json',
    tags: [category, 'bundle', 'curated', 'ai-generated'],
  };
}

async function uploadContent(content: any, type: string): Promise<string> {
  // TODO: Upload to S3/Supabase Storage
  // For now, return JSON encoded as data URL
  const jsonString = JSON.stringify(content, null, 2);
  return `data:application/json;base64,${Buffer.from(jsonString).toString('base64')}`;
}

async function generateThumbnail(title: string, type: string): Promise<string> {
  // TODO: Generate actual thumbnail with DALL-E or Replicate
  // For now, return placeholder
  return `https://via.placeholder.com/400x300/667eea/ffffff?text=${encodeURIComponent(title)}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '20');

  let query = supabase
    .from('digital_products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (type) query = query.eq('type', type);
  if (category) query = query.eq('category', category);

  const { data: products, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products });
}
