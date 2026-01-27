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
import { log as ndLog, timeAsync } from '@/lib/server-ndjson';

const spiritSystem = new AISpiritSystem();

/**
 * Update Street Popularity
 * Runs every hour - recalculates popularity scores based on recent analytics
 */
export async function updateStreetPopularity() {
  ndLog('info','job_start',{job:'updateStreetPopularity'});

  try {
    const { data: streets, error } = await timeAsync('supabase.streets.fetch_all', async () => (await supabase.from('streets').select('id, slug, name, popularity_score')).data || [], { job: 'updateStreetPopularity' }) as any;

    if (!streets || (error && error !== null)) {
      ndLog('warn','job_step_error',{job:'updateStreetPopularity', error: String(error)});
      return;
    }

    for (const street of streets) {
      // Calculate new popularity based on last 7 days of analytics
      const { data: analytics } = await timeAsync('supabase.world_analytics.fetch_recent', async () => (await supabase.from('world_analytics').select('metric_value').eq('layer_type', 'street').eq('entity_id', street.id).gte('recorded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())).data || [], { street: street.id, job: 'updateStreetPopularity' }) as any;

      if (analytics && analytics.length > 0) {
        // Calculate weighted average
        const avgEngagement = analytics.reduce((sum, a) => sum + (a.metric_value || 0), 0) / analytics.length;
        const visitCount = analytics.length;
        
        // Popularity formula: (avg engagement * 10) + (visits / 100)
        const newScore = Math.min(100, (avgEngagement * 10) + (visitCount / 100));

        // Update street
        await timeAsync('supabase.streets.update', async () => await supabase.from('streets').update({
          popularity_score: newScore,
          trending: newScore > 70,
          updated_at: new Date().toISOString()
        }).eq('id', street.id), { street: street.id, job: 'updateStreetPopularity' });

        ndLog('info','job_step',{job:'updateStreetPopularity', street: street.slug, old: street.popularity_score, new: newScore});
      }
    }

    ndLog('info','job_end',{job:'updateStreetPopularity'});
  } catch (error) {
    ndLog('error','job_failed',{job:'updateStreetPopularity', error: String(error)});
  }
}

/**
 * Evolve AI Spirits
 * Runs daily - AI personalities adapt based on user interactions
 */
export async function evolveAISpirits() {
  ndLog('info','job_start',{job:'evolveAISpirits'});

  try {
    const { data: spirits, error } = await timeAsync('supabase.ai_spirits.fetch', async () => (await supabase.from('ai_spirits').select('*').gte('interaction_count', 10)).data || [], { job: 'evolveAISpirits' }) as any;

    if (!spirits || (error && error !== null)) {
      ndLog('warn','job_step_error',{job:'evolveAISpirits', error: String(error)});
      return;
    }

    for (const spirit of spirits) {
      // Get recent interactions
      const interactions = await timeAsync('supabase.spirit_interactions.fetch_recent', async () => (await supabase.from('spirit_interactions').select('*').eq('spirit_id', spirit.id).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).order('created_at', { ascending: false })).data || [], { spiritId: spirit.id, job: 'evolveAISpirits' }) as any;

      if (interactions && interactions.length >= 5) {
        // Analyze interaction patterns
        const sentiments = interactions.map((i:any) => i.user_sentiment);
        const engagedCount = sentiments.filter((s:any) => s === 'engaged').length;
        const disengagedCount = sentiments.filter((s:any) => s === 'disengaged').length;

        // Only evolve if there's meaningful engagement
        if (engagedCount > disengagedCount) {
          ndLog('info','job_step',{job:'evolveAISpirits', spirit: spirit.id});
          await timeAsync('AISpiritSystem.evolveSpiritPersonality', async () => spiritSystem.evolveSpiritPersonality(spirit.entity_type, spirit.entity_id, interactions), { spirit: spirit.id, job: 'evolveAISpirits' });

          ndLog('info','job_step',{job:'evolveAISpirits', msg: `Evolved ${spirit.spirit_data?.name || 'unknown'}`, spirit: spirit.id});
        }
      }
    }

    ndLog('info','job_end',{job:'evolveAISpirits'});
  } catch (error) {
    ndLog('error','job_failed',{job:'evolveAISpirits', error: String(error)});
  }
} 

/**
 * Regenerate Atmospheric Content
 * Runs daily - Creates fresh atmospheric descriptions for variety
 */
export async function regenerateAtmosphericContent() {
  ndLog('info','job_start',{job:'regenerateAtmosphericContent'});

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

      const entities = await timeAsync('supabase.' + table + '.fetch', async () => (await supabase.from(table).select('id, name')).data || [], { job: 'regenerateAtmosphericContent', layerType });

      if (entities && (entities as any).length) {
        for (const entity of entities as any[]) {
          // Generate new atmospheric state
          const stateData = {
            timeOfDay,
            mood: generateMoodForTime(timeOfDay),
            brightness: calculateBrightness(timeOfDay),
            lastUpdated: new Date().toISOString()
          };

          await timeAsync('supabase.atmospheric_states.upsert', async () => await supabase.from('atmospheric_states').upsert({
            entity_type: layerType,
            entity_id: entity.id,
            state_data: stateData,
            time_of_day: timeOfDay,
            active: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'entity_type,entity_id' }), { job: 'regenerateAtmosphericContent', layerType, entityId: entity.id });
        }

        ndLog('info','job_step',{job:'regenerateAtmosphericContent', layerType, updated: (entities as any).length});
      }
    }

    ndLog('info','job_end',{job:'regenerateAtmosphericContent'});
  } catch (error) {
    ndLog('error','job_failed',{job:'regenerateAtmosphericContent', error: String(error)});
  }
} 

/**
 * Aggregate World Analytics
 * Runs daily - Summarizes analytics for insights
 */
export async function aggregateWorldAnalytics() {
  ndLog('info','job_start',{job:'aggregateWorldAnalytics'});

  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get analytics from last 24 hours
    const analytics = await timeAsync('supabase.world_analytics.fetch', async () => (await supabase.from('world_analytics').select('*').gte('recorded_at', yesterday.toISOString())).data || [], { job: 'aggregateWorldAnalytics' }) as any;

    if (analytics && analytics.length > 0) {
      // Group by layer type and entity
      const grouped = analytics.reduce((acc: any, item: any) => {
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
      }, {});

      ndLog('info','job_summary',{job:'aggregateWorldAnalytics', events: analytics.length, uniqueEntities: Object.keys(grouped).length, uniqueUsers: new Set(analytics.map((a:any) => a.user_id)).size});
    }

    ndLog('info','job_end',{job:'aggregateWorldAnalytics'});
  } catch (error) {
    ndLog('error','job_failed',{job:'aggregateWorldAnalytics', error: String(error)});
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
  ndLog('info','job_start',{job:'runMerchandisingOptimization'});
  
  try {
    const { merchandisingEngine } = await import('../revenue/merchandising-engine');
    await timeAsync('merchandisingEngine.runMerchandisingOptimization', async () => merchandisingEngine.runMerchandisingOptimization(), { job: 'runMerchandisingOptimization' });
    ndLog('info','job_end',{job:'runMerchandisingOptimization'});
  } catch (error) {
    ndLog('error','job_failed',{job:'runMerchandisingOptimization', error: String(error)});
  }
}

/**
 * Run content optimization
 */
export async function runContentOptimization() {
  ndLog('info','job_start',{job:'runContentOptimization'});
  
  try {
    const { contentGenerator } = await import('../revenue/content-generator');
    await timeAsync('contentGenerator.runWeeklyContentOptimization', async () => contentGenerator.runWeeklyContentOptimization(), { job: 'runContentOptimization' });
    ndLog('info','job_end',{job:'runContentOptimization'});
  } catch (error) {
    ndLog('error','job_failed',{job:'runContentOptimization', error: String(error)});
  }
}

/**
 * Run bundle generation
 */
export async function runBundleGeneration() {
  ndLog('info','job_start',{job:'runBundleGeneration'});
  
  try {
    const { bundlingEngine } = await import('../revenue/bundling-engine');
    await timeAsync('bundlingEngine.runBundleGeneration', async () => bundlingEngine.runBundleGeneration(), { job: 'runBundleGeneration' });
    ndLog('info','job_end',{job:'runBundleGeneration'});
  } catch (error) {
    ndLog('error','job_failed',{job:'runBundleGeneration', error: String(error)});
  }
}

/**
 * Run all world evolution jobs (including revenue optimization)
 */
export async function runWorldEvolutionJobs() {
  ndLog('info','job_start',{job:'runWorldEvolutionJobs'});
  const startTime = Date.now();

  // World Architecture Evolution
  await timeAsync('world.updateStreetPopularity', async () => updateStreetPopularity(), { job: 'runWorldEvolutionJobs', step: 'updateStreetPopularity' });
  await timeAsync('world.evolveAISpirits', async () => evolveAISpirits(), { job: 'runWorldEvolutionJobs', step: 'evolveAISpirits' });
  await timeAsync('world.regenerateAtmosphericContent', async () => regenerateAtmosphericContent(), { job: 'runWorldEvolutionJobs', step: 'regenerateAtmosphericContent' });
  await timeAsync('world.aggregateWorldAnalytics', async () => aggregateWorldAnalytics(), { job: 'runWorldEvolutionJobs', step: 'aggregateWorldAnalytics' });

  // Revenue Optimization (run less frequently)
  const hour = new Date().getHours();
  if (hour === 3) { // Run at 3 AM
    await timeAsync('world.runMerchandisingOptimization', async () => runMerchandisingOptimization(), { job: 'runWorldEvolutionJobs', step: 'runMerchandisingOptimization' });
    await timeAsync('world.runBundleGeneration', async () => runBundleGeneration(), { job: 'runWorldEvolutionJobs', step: 'runBundleGeneration' });
  }
  if (hour === 4) { // Run at 4 AM
    await timeAsync('world.runContentOptimization', async () => runContentOptimization(), { job: 'runWorldEvolutionJobs', step: 'runContentOptimization' });
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  ndLog('info','job_end',{job:'runWorldEvolutionJobs', duration_s: Number(duration)});
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
