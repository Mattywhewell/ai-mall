/**
 * AI City Activation Helper
 * Utilities to check and enable AI features
 */

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY && 
         process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
}

export function getAIStatus() {
  return {
    openAI: isOpenAIConfigured(),
    cronJobs: !!process.env.CRON_SECRET,
    supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}

import { log as ndLog } from '@/lib/server-ndjson';

export function requireOpenAI(feature: string) {
  if (!isOpenAIConfigured()) {
    ndLog('warn','require_openai',{feature});
    return false;
  }
  return true;
}

/**
 * Get appropriate AI mode based on configuration
 */
export function getAIMode(): 'dynamic' | 'static' {
  return isOpenAIConfigured() ? 'dynamic' : 'static';
}

/**
 * Log AI activation status
 */
export function logAIStatus() {
  const status = getAIStatus();
  ndLog('info','ai_status',{status});

  if (!status.openAI) {
    ndLog('info','ai_enable_instructions',{steps: ['Get API key: https://platform.openai.com/api-keys','Add to .env.local: OPENAI_API_KEY=your_key_here','Restart dev server']});
  }
}
