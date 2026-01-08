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

export function requireOpenAI(feature: string) {
  if (!isOpenAIConfigured()) {
    console.warn(`[AI City] ${feature} requires OpenAI API key. Using fallback.`);
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
  console.log('\n🌆 AI CITY SYSTEMS STATUS:');
  console.log(`  ${status.openAI ? '✅' : '⚠️'} OpenAI: ${status.openAI ? 'Active' : 'Disabled (static fallbacks)'}`);
  console.log(`  ${status.cronJobs ? '✅' : '⚠️'} Cron Jobs: ${status.cronJobs ? 'Configured' : 'Not configured'}`);
  console.log(`  ${status.supabase ? '✅' : '❌'} Supabase: ${status.supabase ? 'Connected' : 'Not configured'}`);
  console.log(`  🎨 Mode: ${getAIMode().toUpperCase()}`);
  console.log('');
  
  if (!status.openAI) {
    console.log('💡 To enable dynamic AI:');
    console.log('   1. Get API key: https://platform.openai.com/api-keys');
    console.log('   2. Add to .env.local: OPENAI_API_KEY=your_key_here');
    console.log('   3. Restart dev server');
    console.log('');
  }
}
