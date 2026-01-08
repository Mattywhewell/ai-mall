/**
 * World Evolution Jobs
 * 
 * Background jobs that make the AI city feel alive and adaptive:
 * - Update street popularity scores
 * - Evolve AI spirit personalities based on interactions
 * - Regenerate atmospheric content
 * - Track world analytics
 */

import { supabase } from '@/lib/supabaseClient';
import { AISpiritSystem } from '@/lib/ai-city/spirits';

const spiritSystem = new AISpiritSystem();

/**
 * Update Street Popularity
 * Runs every hour - recalculates popularity scores based on recent analytics
 */
export async function updateStreetPopularity() {
  console.log('[World Evolution] Updating street popularity scores...');

  try {
    const { data: streets, error } = await supabase
      .from('streets')
      .select('id, slug, name, popularity_score');

    if (error || !streets) {
      console.error('Failed to fetch streets:', error);
      return;
    }

    for (const street of streets) {
      // Calculate new popularity based on last 7 days of analytics
      const { data: analytics } = await supabase
        .from('world_analytics')
        .select('metric_value')
        .eq('layer_type', 'street')
        .eq('entity_id', street.id)
        .gte('recorded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (analytics && analytics.length > 0) {
        // Calculate weighted average
        const avgEngagement = analytics.reduce((sum, a) => sum + (a.metric_value || 0), 0) / analytics.length;
        const visitCount = analytics.length;
        
        // Popularity formula: (avg engagement * 10) + (visits / 100)
        const newScore = Math.min(100, (avgEngagement * 10) + (visitCount / 100));

        // Update street
        await supabase
          .from('streets')
          .update({
            popularity_score: newScore,
            trending: newScore > 70,
            updated_at: new Date().toISOString()
          })
          .eq('id', street.id);

        console.log(`  ✓ ${street.name}: ${street.popularity_score} → ${newScore.toFixed(2)}`);
      }
    }

    console.log('[World Evolution] Street popularity update complete');
  } catch (error) {
    console.error('[World Evolution] Error updating street popularity:', error);
  }
}

/**
 * Evolve AI Spirits
 * Runs daily - AI personalities adapt based on user interactions
 */
export async function evolveAISpirits() {
  console.log('[World Evolution] Evolving AI spirit personalities...');

  try {
    const { data: spirits, error } = await supabase
      .from('ai_spirits')
      .select('*')
      .gte('interaction_count', 10); // Only evolve spirits with significant interactions

    if (error || !spirits) {
      console.error('Failed to fetch spirits:', error);
      return;
    }

    for (const spirit of spirits) {
      // Get recent interactions
      const { data: interactions } = await supabase
        .from('spirit_interactions')
        .select('*')
        .eq('spirit_id', spirit.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (interactions && interactions.length >= 5) {
        // Analyze interaction patterns
        const sentiments = interactions.map(i => i.user_sentiment);
        const engagedCount = sentiments.filter(s => s === 'engaged').length;
        const disengagedCount = sentiments.filter(s => s === 'disengaged').length;

        // Only evolve if there's meaningful engagement
        if (engagedCount > disengagedCount) {
          const evolvedSpirit = await spiritSystem.evolveSpiritPersonality(
            spirit.entity_type,
            spirit.entity_id,
            interactions
          );

          console.log(`  ✓ Evolved ${spirit.spirit_data.name} (${spirit.entity_type})`);
        }
      }
    }

    console.log('[World Evolution] AI spirit evolution complete');
  } catch (error) {
    console.error('[World Evolution] Error evolving spirits:', error);
  }
}

/**
 * Regenerate Atmospheric Content
 * Runs daily - Creates fresh atmospheric descriptions for variety
 */
export async function regenerateAtmosphericContent() {
  console.log('[World Evolution] Regenerating atmospheric content...');

  try {
    const currentHour = new Date().getHours();
    const timeOfDay = currentHour < 6 ? 'night' :
                      currentHour < 12 ? 'morning' :
                      currentHour < 18 ? 'afternoon' : 'evening';

    // Update atmospheric states for all layers
    const layerTypes = ['hall', 'street', 'chapel'];

    for (const layerType of layerTypes) {
      const table = layerType === 'hall' ? 'halls' :
                    layerType === 'street' ? 'streets' : 'chapels';

      const { data: entities } = await supabase
        .from(table)
        .select('id, name');

      if (entities) {
        for (const entity of entities) {
          // Generate new atmospheric state
          const stateData = {
            timeOfDay,
            mood: generateMoodForTime(timeOfDay),
            brightness: calculateBrightness(timeOfDay),
            lastUpdated: new Date().toISOString()
          };

          await supabase
            .from('atmospheric_states')
            .upsert({
              entity_type: layerType,
              entity_id: entity.id,
              state_data: stateData,
              time_of_day: timeOfDay,
              active: true,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'entity_type,entity_id'
            });
        }

        console.log(`  ✓ Updated ${entities.length} ${layerType}s`);
      }
    }

    console.log('[World Evolution] Atmospheric regeneration complete');
  } catch (error) {
    console.error('[World Evolution] Error regenerating atmospheric content:', error);
  }
}

/**
 * Aggregate World Analytics
 * Runs daily - Summarizes analytics for insights
 */
export async function aggregateWorldAnalytics() {
  console.log('[World Evolution] Aggregating world analytics...');

  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get analytics from last 24 hours
    const { data: analytics } = await supabase
      .from('world_analytics')
      .select('*')
      .gte('recorded_at', yesterday.toISOString());

    if (analytics && analytics.length > 0) {
      // Group by layer type and entity
      const grouped = analytics.reduce((acc, item) => {
        const key = `${item.layer_type}:${item.entity_id}`;
        if (!acc[key]) {
          acc[key] = {
            layer_type: item.layer_type,
            entity_id: item.entity_id,
            views: 0,
            totalEngagement: 0,
            uniqueUsers: new Set()
          };
        }

        if (item.metric_type === 'view') acc[key].views++;
        if (item.metric_type === 'engagement') acc[key].totalEngagement += item.metric_value;
        if (item.user_id) acc[key].uniqueUsers.add(item.user_id);

        return acc;
      }, {} as Record<string, any>);

      console.log(`  📊 Processed ${analytics.length} analytics events`);
      console.log(`  📊 Unique entities: ${Object.keys(grouped).length}`);
      console.log(`  📊 Total unique users: ${new Set(analytics.map(a => a.user_id)).size}`);
    }

    console.log('[World Evolution] Analytics aggregation complete');
  } catch (error) {
    console.error('[World Evolution] Error aggregating analytics:', error);
  }
}

// Helper functions
function generateMoodForTime(timeOfDay: string): string {
  const moods = {
    morning: ['fresh', 'awakening', 'bright', 'energizing'],
    afternoon: ['vibrant', 'bustling', 'active', 'dynamic'],
    evening: ['warm', 'golden', 'transitioning', 'reflective'],
    night: ['mystical', 'quiet', 'intimate', 'serene']
  };
  
  const moodList = moods[timeOfDay as keyof typeof moods] || moods.afternoon;
  return moodList[Math.floor(Math.random() * moodList.length)];
}

function calculateBrightness(timeOfDay: string): number {
  const brightness = {
    morning: 0.8,
    afternoon: 1.0,
    evening: 0.6,
    night: 0.3
  };
  
  return brightness[timeOfDay as keyof typeof brightness] || 0.7;
}

/**
 * Run merchandising optimization
 */
export async function runMerchandisingOptimization() {
  console.log('[World Evolution] Running merchandising optimization...');
  
  try {
    const { merchandisingEngine } = await import('../revenue/merchandising-engine');
    await merchandisingEngine.runMerchandisingOptimization();
    console.log('[World Evolution] Merchandising optimization complete');
  } catch (error) {
    console.error('[World Evolution] Merchandising error:', error);
  }
}

/**
 * Run content optimization
 */
export async function runContentOptimization() {
  console.log('[World Evolution] Running content optimization...');
  
  try {
    const { contentGenerator } = await import('../revenue/content-generator');
    await contentGenerator.runWeeklyContentOptimization();
    console.log('[World Evolution] Content optimization complete');
  } catch (error) {
    console.error('[World Evolution] Content optimization error:', error);
  }
}

/**
 * Run bundle generation
 */
export async function runBundleGeneration() {
  console.log('[World Evolution] Running bundle generation...');
  
  try {
    const { bundlingEngine } = await import('../revenue/bundling-engine');
    await bundlingEngine.runBundleGeneration();
    console.log('[World Evolution] Bundle generation complete');
  } catch (error) {
    console.error('[World Evolution] Bundle generation error:', error);
  }
}

/**
 * Run all world evolution jobs (including revenue optimization)
 */
export async function runWorldEvolutionJobs() {
  console.log('=== World Evolution Jobs Started ===');
  const startTime = Date.now();

  // World Architecture Evolution
  await updateStreetPopularity();
  await evolveAISpirits();
  await regenerateAtmosphericContent();
  await aggregateWorldAnalytics();

  // Revenue Optimization (run less frequently)
  const hour = new Date().getHours();
  if (hour === 3) { // Run at 3 AM
    await runMerchandisingOptimization();
    await runBundleGeneration();
  }
  if (hour === 4) { // Run at 4 AM
    await runContentOptimization();
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`=== World Evolution Jobs Complete (${duration}s) ===`);
}

// Export individual jobs for flexible scheduling
export default {
  updateStreetPopularity,
  evolveAISpirits,
  regenerateAtmosphericContent,
  aggregateWorldAnalytics,
  runMerchandisingOptimization,
  runContentOptimization,
  runBundleGeneration,
  runWorldEvolutionJobs
};
