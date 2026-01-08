/**
 * Self-Healing System
 * Automatically detects and repairs issues
 */

import { supabase } from '../supabaseClient';
import { callOpenAI } from '../ai/openaiClient';

export interface HealthIssue {
  id: string;
  type: 'broken_image' | 'missing_data' | 'slow_query' | 'data_inconsistency' | 'performance_degradation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  entity_type: string;
  entity_id: string;
  description: string;
  detected_at: string;
  resolved_at?: string;
  auto_fixed: boolean;
  fix_applied?: string;
}

export class SelfHealingSystem {
  private static healingInProgress = false;

  /**
   * Run comprehensive health check
   */
  static async runHealthCheck(): Promise<HealthIssue[]> {
    if (this.healingInProgress) {
      console.log('⚕️  Healing already in progress, skipping...');
      return [];
    }

    this.healingInProgress = true;
    console.log('🔍 Running system health check...');

    const issues: HealthIssue[] = [];

    try {
      // Check for broken images
      const brokenImages = await this.checkBrokenImages();
      issues.push(...brokenImages);

      // Check for missing product data
      const missingData = await this.checkMissingData();
      issues.push(...missingData);

      // Check for slow queries
      const slowQueries = await this.checkPerformance();
      issues.push(...slowQueries);

      // Check for data inconsistencies
      const inconsistencies = await this.checkDataConsistency();
      issues.push(...inconsistencies);

      console.log(`🔍 Found ${issues.length} issues`);

      // Auto-heal what we can
      const autoHealed = await this.autoHeal(issues);
      console.log(`⚕️  Auto-healed ${autoHealed} issues`);

      // Log remaining issues
      if (issues.length > autoHealed) {
        await this.logIssues(issues.filter((i) => !i.auto_fixed));
      }

      return issues;
    } finally {
      this.healingInProgress = false;
    }
  }

  /**
   * Check for broken product images
   */
  private static async checkBrokenImages(): Promise<HealthIssue[]> {
    const issues: HealthIssue[] = [];

    const { data: products } = await supabase
      .from('products')
      .select('id, name, image_url')
      .limit(100);

    if (!products) return issues;

    for (const product of products) {
      if (!product.image_url || product.image_url === '') {
        issues.push({
          id: `broken_image_${product.id}`,
          type: 'broken_image',
          severity: 'medium',
          entity_type: 'product',
          entity_id: product.id,
          description: `Product "${product.name}" has no image URL`,
          detected_at: new Date().toISOString(),
          auto_fixed: false,
        });
      } else {
        // Check if image URL is accessible (simplified check)
        if (
          !product.image_url.startsWith('http://') &&
          !product.image_url.startsWith('https://')
        ) {
          issues.push({
            id: `invalid_image_${product.id}`,
            type: 'broken_image',
            severity: 'medium',
            entity_type: 'product',
            entity_id: product.id,
            description: `Product "${product.name}" has invalid image URL format`,
            detected_at: new Date().toISOString(),
            auto_fixed: false,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check for missing critical data
   */
  private static async checkMissingData(): Promise<HealthIssue[]> {
    const issues: HealthIssue[] = [];

    // Check products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, tags')
      .limit(100);

    if (!products) return issues;

    for (const product of products) {
      if (!product.description || product.description.length < 50) {
        issues.push({
          id: `missing_desc_${product.id}`,
          type: 'missing_data',
          severity: 'high',
          entity_type: 'product',
          entity_id: product.id,
          description: `Product "${product.name}" has insufficient description`,
          detected_at: new Date().toISOString(),
          auto_fixed: false,
        });
      }

      if (!product.tags || product.tags.length === 0) {
        issues.push({
          id: `missing_tags_${product.id}`,
          type: 'missing_data',
          severity: 'medium',
          entity_type: 'product',
          entity_id: product.id,
          description: `Product "${product.name}" has no tags`,
          detected_at: new Date().toISOString(),
          auto_fixed: false,
        });
      }
    }

    // Check for products without embeddings
    const { data: productsWithoutEmbeddings } = await supabase
      .from('products')
      .select('id, name')
      .is('embedding', null)
      .limit(50);

    if (productsWithoutEmbeddings) {
      productsWithoutEmbeddings.forEach((product) => {
        issues.push({
          id: `missing_embedding_${product.id}`,
          type: 'missing_data',
          severity: 'high',
          entity_type: 'product',
          entity_id: product.id,
          description: `Product "${product.name}" is missing semantic search embedding`,
          detected_at: new Date().toISOString(),
          auto_fixed: false,
        });
      });
    }

    return issues;
  }

  /**
   * Check system performance
   */
  private static async checkPerformance(): Promise<HealthIssue[]> {
    const issues: HealthIssue[] = [];

    // Check for products with extremely slow load times (from analytics)
    const { data: slowProducts } = await supabase
      .from('analytics')
      .select('product_id, metadata')
      .eq('event_type', 'view')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(100);

    if (slowProducts) {
      const productLoadTimes: Record<string, number[]> = {};

      slowProducts.forEach((event) => {
        if (event.metadata?.load_time && event.product_id) {
          if (!productLoadTimes[event.product_id]) {
            productLoadTimes[event.product_id] = [];
          }
          productLoadTimes[event.product_id].push(event.metadata.load_time);
        }
      });

      for (const [productId, times] of Object.entries(productLoadTimes)) {
        const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
        if (avgTime > 3000) {
          // More than 3 seconds
          issues.push({
            id: `slow_load_${productId}`,
            type: 'slow_query',
            severity: 'medium',
            entity_type: 'product',
            entity_id: productId,
            description: `Product page loading slowly (avg: ${avgTime.toFixed(0)}ms)`,
            detected_at: new Date().toISOString(),
            auto_fixed: false,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check data consistency
   */
  private static async checkDataConsistency(): Promise<HealthIssue[]> {
    const issues: HealthIssue[] = [];

    // Check for orphaned products (microstore doesn't exist)
    const { data: orphanedProducts } = await supabase.rpc('find_orphaned_products');

    if (orphanedProducts && orphanedProducts.length > 0) {
      orphanedProducts.forEach((product: any) => {
        issues.push({
          id: `orphaned_${product.id}`,
          type: 'data_inconsistency',
          severity: 'critical',
          entity_type: 'product',
          entity_id: product.id,
          description: `Product "${product.name}" references non-existent microstore`,
          detected_at: new Date().toISOString(),
          auto_fixed: false,
        });
      });
    }

    // Check for orders without items
    const { data: emptyOrders } = await supabase.rpc('find_empty_orders');

    if (emptyOrders && emptyOrders.length > 0) {
      emptyOrders.forEach((order: any) => {
        issues.push({
          id: `empty_order_${order.id}`,
          type: 'data_inconsistency',
          severity: 'high',
          entity_type: 'order',
          entity_id: order.id,
          description: `Order has no items`,
          detected_at: new Date().toISOString(),
          auto_fixed: false,
        });
      });
    }

    return issues;
  }

  /**
   * Auto-heal issues
   */
  private static async autoHeal(issues: HealthIssue[]): Promise<number> {
    let healedCount = 0;

    for (const issue of issues) {
      try {
        let healed = false;
        let fixDescription = '';

        switch (issue.type) {
          case 'broken_image':
            healed = await this.healBrokenImage(issue);
            fixDescription = 'Generated placeholder image URL';
            break;

          case 'missing_data':
            healed = await this.healMissingData(issue);
            fixDescription = 'Generated missing data using AI';
            break;

          case 'data_inconsistency':
            healed = await this.healDataInconsistency(issue);
            fixDescription = 'Corrected data inconsistency';
            break;

          case 'performance_degradation':
            healed = await this.healPerformance(issue);
            fixDescription = 'Applied performance optimization';
            break;
        }

        if (healed) {
          issue.auto_fixed = true;
          issue.resolved_at = new Date().toISOString();
          issue.fix_applied = fixDescription;
          healedCount++;
        }
      } catch (error) {
        console.error(`Failed to heal issue ${issue.id}:`, error);
      }
    }

    return healedCount;
  }

  /**
   * Heal broken image
   */
  private static async healBrokenImage(issue: HealthIssue): Promise<boolean> {
    // For demo purposes, set a placeholder
    const placeholderUrl = `https://placehold.co/400x400/indigo/white?text=Product+Image`;

    const { error } = await supabase
      .from('products')
      .update({ image_url: placeholderUrl })
      .eq('id', issue.entity_id);

    return !error;
  }

  /**
   * Heal missing data
   */
  private static async healMissingData(issue: HealthIssue): Promise<boolean> {
    if (issue.description.includes('description')) {
      // Generate description using AI
      const { data: product } = await supabase
        .from('products')
        .select('*, microstore:microstores(category)')
        .eq('id', issue.entity_id)
        .single();

      if (!product) return false;

      const { generateProductDescription } = await import('../ai/generateDescription');
      const description = await generateProductDescription(
        product.name,
        product.microstore?.category || 'general',
        'General'
      );

      const { error } = await supabase
        .from('products')
        .update({ description: description.longDescription })
        .eq('id', issue.entity_id);

      return !error;
    }

    if (issue.description.includes('tags')) {
      // Generate tags using AI
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', issue.entity_id)
        .single();

      if (!product) return false;

      const { generateProductTags } = await import('../ai/generateTags');
      const tags = await generateProductTags(
        product.name,
        product.description || '',
        'General'
      );

      const { error } = await supabase
        .from('products')
        .update({ tags })
        .eq('id', issue.entity_id);

      return !error;
    }

    if (issue.description.includes('embedding')) {
      // Generate embedding
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', issue.entity_id)
        .single();

      if (!product) return false;

      const { generateProductEmbedding } = await import('../ai/semanticSearch');
      const embedding = await generateProductEmbedding(
        product.name,
        product.description || '',
        product.tags || []
      );

      const { error } = await supabase
        .from('products')
        .update({ embedding })
        .eq('id', issue.entity_id);

      return !error;
    }

    return false;
  }

  /**
   * Heal data inconsistency
   */
  private static async healDataInconsistency(issue: HealthIssue): Promise<boolean> {
    if (issue.description.includes('orphaned')) {
      // Move to a default microstore or delete
      const { data: defaultMicrostore } = await supabase
        .from('microstores')
        .select('id')
        .limit(1)
        .single();

      if (defaultMicrostore) {
        const { error } = await supabase
          .from('products')
          .update({ microstore_id: defaultMicrostore.id })
          .eq('id', issue.entity_id);

        return !error;
      }
    }

    if (issue.description.includes('empty order')) {
      // Mark order as cancelled
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', issue.entity_id);

      return !error;
    }

    return false;
  }

  /**
   * Heal performance issue
   */
  private static async healPerformance(issue: HealthIssue): Promise<boolean> {
    // Could implement caching, image optimization, etc.
    return false;
  }

  /**
   * Log issues that couldn't be auto-fixed
   */
  private static async logIssues(issues: HealthIssue[]) {
    for (const issue of issues) {
      await supabase.from('health_issues').insert({
        type: issue.type,
        severity: issue.severity,
        entity_type: issue.entity_type,
        entity_id: issue.entity_id,
        description: issue.description,
        auto_fixed: issue.auto_fixed,
        fix_applied: issue.fix_applied,
        detected_at: issue.detected_at,
        resolved_at: issue.resolved_at,
      });
    }
  }

  /**
   * Generate AI fix suggestion for unresolved issue
   */
  static async generateFixSuggestion(issue: HealthIssue): Promise<string> {
    const systemPrompt = `You are a system debugging AI. Given a health issue in an e-commerce system, suggest a specific fix.

Be concise and actionable. Format as a step-by-step fix.`;

    const userPrompt = `Issue Type: ${issue.type}
Severity: ${issue.severity}
Entity: ${issue.entity_type} (${issue.entity_id})
Description: ${issue.description}

Suggest a fix.`;

    try {
      const suggestion = await callOpenAI(systemPrompt, userPrompt, 0.6);
      return suggestion;
    } catch (error) {
      return 'Unable to generate fix suggestion';
    }
  }
}
