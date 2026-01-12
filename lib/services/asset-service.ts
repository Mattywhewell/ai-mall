import { createClient } from '@/lib/supabaseServer';

export interface AssetData {
  type: 'model' | 'scene' | 'avatar' | 'sigil' | 'ritual-object' | 'district-asset';
  name: string;
  description?: string;
  file_url: string;
  file_size_bytes?: number;
  file_format?: string;
  created_by: string;
  created_from_upload_id?: string;
  district_assignment?: string;
  ritual_assignment?: string;
  citizen_archetype?: string;
  generation_prompt?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Store asset in database following mythic standards
 * Following Additive Design Law: expand storage capabilities
 */
export async function storeAsset(assetData: AssetData) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('assets')
    .insert({
      ...assetData,
      is_public: assetData.metadata?.is_public ?? false,
      is_featured: assetData.metadata?.is_featured ?? false,
      tags: assetData.tags || [],
      metadata: assetData.metadata || {}
    })
    .select()
    .single();

  if (error) {
    console.error('Asset storage error:', error);
    throw new Error(`Failed to store asset: ${error.message}`);
  }

  return data;
}

/**
 * Get asset by ID with usage tracking
 */
export async function getAsset(assetId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .single();

  if (error) {
    console.error('Asset retrieval error:', error);
    throw new Error(`Failed to get asset: ${error.message}`);
  }

  // Increment usage count
  await supabase.rpc('increment_asset_usage', { asset_id: assetId });

  return data;
}

/**
 * Get assets by district, ritual, or archetype
 */
export async function getAssetsByCategory(filters: {
  district?: string;
  ritual?: string;
  archetype?: string;
  type?: string;
  isPublic?: boolean;
  limit?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.district) {
    query = query.eq('district_assignment', filters.district);
  }

  if (filters.ritual) {
    query = query.eq('ritual_assignment', filters.ritual);
  }

  if (filters.archetype) {
    query = query.eq('citizen_archetype', filters.archetype);
  }

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.isPublic !== undefined) {
    query = query.eq('is_public', filters.isPublic);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Asset query error:', error);
    throw new Error(`Failed to query assets: ${error.message}`);
  }

  return data;
}

/**
 * Update asset metadata (additive updates only)
 */
export async function updateAsset(assetId: string, updates: Partial<AssetData>) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('assets')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', assetId)
    .select()
    .single();

  if (error) {
    console.error('Asset update error:', error);
    throw new Error(`Failed to update asset: ${error.message}`);
  }

  return data;
}

/**
 * Get featured assets for the city display
 */
export async function getFeaturedAssets(limit: number = 10) {
  return getAssetsByCategory({
    isPublic: true,
    limit
  }).then(assets => assets.filter(asset => asset.is_featured));
}

/**
 * Search assets by tags or name
 */
export async function searchAssets(searchTerm: string, filters: {
  type?: string;
  district?: string;
  isPublic?: boolean;
} = {}) {
  const supabase = await createClient();

  let query = supabase
    .from('assets')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.district) {
    query = query.eq('district_assignment', filters.district);
  }

  if (filters.isPublic !== undefined) {
    query = query.eq('is_public', filters.isPublic);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Asset search error:', error);
    throw new Error(`Failed to search assets: ${error.message}`);
  }

  return data;
}