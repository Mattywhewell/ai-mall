/**
 * AI Prompt Versioning System
 * Manages prompt versions, tracks changes, and enables rollbacks
 */

import { getSupabaseClient } from '@/lib/supabase-server';

export interface PromptVersion {
  id: string;
  name: string;
  version: number;
  prompt_text: string;
  variables: Record<string, string>;
  model: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  is_locked: boolean;
  created_by: string;
  created_at: string;
  change_reason?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'auto_listing' | 'recommendation' | 'search' | 'moderation' | 'other';
  latest_version: number;
  active_version: number;
}

export class PromptVersioningService {
  /**
   * Get active prompt by name
   */
  async getActivePrompt(name: string): Promise<PromptVersion | null> {
    const { data, error } = await getSupabaseClient()
      .from('ai_prompt_versions')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching active prompt:', error);
      return null;
    }

    return data;
  }

  /**
   * Get specific version of prompt
   */
  async getPromptVersion(name: string, version: number): Promise<PromptVersion | null> {
    const { data, error } = await getSupabaseClient()
      .from('ai_prompt_versions')
      .select('*')
      .eq('name', name)
      .eq('version', version)
      .single();

    if (error) {
      console.error('Error fetching prompt version:', error);
      return null;
    }

    return data;
  }

  /**
   * Create new prompt version
   */
  async createVersion(
    name: string,
    promptText: string,
    config: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      variables?: Record<string, string>;
      changeReason?: string;
      createdBy: string;
    }
  ): Promise<PromptVersion | null> {
    // Get latest version number
    const { data: latestVersion } = await getSupabaseClient()
      .from('ai_prompt_versions')
      .select('version')
      .eq('name', name)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const newVersion = (latestVersion?.version || 0) + 1;

    // Create new version
    const { data, error } = await getSupabaseClient()
      .from('ai_prompt_versions')
      .insert({
        name,
        version: newVersion,
        prompt_text: promptText,
        variables: config.variables || {},
        model: config.model || 'gpt-4-turbo-preview',
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 2000,
        is_active: false, // Don't activate immediately
        is_locked: false,
        created_by: config.createdBy,
        change_reason: config.changeReason,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating prompt version:', error);
      return null;
    }

    // Log the change
    await this.logPromptChange(name, newVersion, 'created', config.createdBy);

    return data;
  }

  /**
   * Activate a specific version
   */
  async activateVersion(name: string, version: number, userId: string): Promise<boolean> {
    // Check if version exists and is not locked
    const { data: versionData, error: fetchError } = await getSupabaseClient()
      .from('ai_prompt_versions')
      .select('is_locked')
      .eq('name', name)
      .eq('version', version)
      .single();

    if (fetchError || !versionData) {
      console.error('Version not found:', fetchError);
      return false;
    }

    if (versionData.is_locked) {
      console.error('Cannot activate locked version');
      return false;
    }

    // Deactivate all other versions
    await getSupabaseClient()
      .from('ai_prompt_versions')
      .update({ is_active: false })
      .eq('name', name);

    // Activate the specified version
    const { error } = await getSupabaseClient()
      .from('ai_prompt_versions')
      .update({ is_active: true })
      .eq('name', name)
      .eq('version', version);

    if (error) {
      console.error('Error activating version:', error);
      return false;
    }

    // Log the change
    await this.logPromptChange(name, version, 'activated', userId);

    return true;
  }

  /**
   * Lock a version (prevent changes/deletion)
   */
  async lockVersion(name: string, version: number, userId: string): Promise<boolean> {
    const { error } = await getSupabaseClient()
      .from('ai_prompt_versions')
      .update({ is_locked: true })
      .eq('name', name)
      .eq('version', version);

    if (error) {
      console.error('Error locking version:', error);
      return false;
    }

    await this.logPromptChange(name, version, 'locked', userId);
    return true;
  }

  /**
   * Get version history
   */
  async getVersionHistory(name: string): Promise<PromptVersion[]> {
    const { data, error } = await getSupabaseClient()
      .from('ai_prompt_versions')
      .select('*')
      .eq('name', name)
      .order('version', { ascending: false });

    if (error) {
      console.error('Error fetching version history:', error);
      return [];
    }

    return data;
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    name: string,
    version1: number,
    version2: number
  ): Promise<{ v1: PromptVersion | null; v2: PromptVersion | null }> {
    const v1 = await this.getPromptVersion(name, version1);
    const v2 = await this.getPromptVersion(name, version2);

    return { v1, v2 };
  }

  /**
   * Rollback to previous version
   */
  async rollback(name: string, targetVersion: number, userId: string): Promise<boolean> {
    const success = await this.activateVersion(name, targetVersion, userId);
    
    if (success) {
      await this.logPromptChange(name, targetVersion, 'rolled_back', userId);
    }

    return success;
  }

  /**
   * Delete version (only if not locked or active)
   */
  async deleteVersion(name: string, version: number, userId: string): Promise<boolean> {
    const { data, error: fetchError } = await getSupabaseClient()
      .from('ai_prompt_versions')
      .select('is_locked, is_active')
      .eq('name', name)
      .eq('version', version)
      .single();

    if (fetchError || !data) {
      return false;
    }

    if (data.is_locked || data.is_active) {
      console.error('Cannot delete locked or active version');
      return false;
    }

    const { error } = await getSupabaseClient()
      .from('ai_prompt_versions')
      .delete()
      .eq('name', name)
      .eq('version', version);

    if (error) {
      console.error('Error deleting version:', error);
      return false;
    }

    await this.logPromptChange(name, version, 'deleted', userId);
    return true;
  }

  /**
   * Log prompt change in audit trail
   */
  private async logPromptChange(
    promptName: string,
    version: number,
    action: string,
    userId: string
  ): Promise<void> {
    await getSupabaseClient().from('audit_logs').insert({
      user_id: userId,
      action: `prompt_${action}`,
      resource_type: 'ai_prompt',
      resource_id: `${promptName}_v${version}`,
      details: {
        prompt_name: promptName,
        version,
        action,
      },
    });
  }

  /**
   * Get all prompt templates
   */
  async getAllTemplates(): Promise<PromptTemplate[]> {
    const { data, error } = await getSupabaseClient()
      .from('ai_prompt_templates')
      .select('*')
      .order('category');

    if (error) {
      console.error('Error fetching templates:', error);
      return [];
    }

    return data;
  }
}

// Example usage:
/*
const promptService = new PromptVersioningService();

// Get active auto-listing prompt
const activePrompt = await promptService.getActivePrompt('auto_listing_product_extraction');

// Create new version
await promptService.createVersion(
  'auto_listing_product_extraction',
  'Extract product details from the following URL...',
  {
    model: 'gpt-4-turbo-preview',
    temperature: 0.3,
    maxTokens: 2000,
    variables: { 'url': 'string' },
    changeReason: 'Improved extraction accuracy for electronics',
    createdBy: userId,
  }
);

// Rollback if needed
await promptService.rollback('auto_listing_product_extraction', 5, userId);
*/
