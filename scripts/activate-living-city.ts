import { config } from 'dotenv';

import * as path from 'path';

// Load environment variables FIRST
const envPath = path.join(__dirname, '../.env.local');
console.log('Loading env from:', envPath);
const result = config({ path: envPath });
console.log('Dotenv result:', result);

import { livingCityEngine } from '../lib/ai-city/living-city-engine';

console.log('🔧 Environment check:');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set');
console.log('SUPABASE_URL value:', `"${process.env.NEXT_PUBLIC_SUPABASE_URL}"`);
console.log('SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');

async function activateLivingCity() {
  console.log('🚀 Activating Living City Engine...');

  try {
    await livingCityEngine.start();
    console.log('✅ Living City Engine activated successfully!');

    // Keep the process running to maintain the engine
    console.log('🔄 Living City Engine is now running. Press Ctrl+C to stop.');

    // Keep alive
    process.on('SIGINT', () => {
      console.log('🛑 Shutting down Living City Engine...');
      livingCityEngine.stop();
      process.exit(0);
    });

    // Prevent exit
    setInterval(() => {
      // Keep alive
    }, 1000);

  } catch (error) {
    console.error('❌ Failed to activate Living City Engine:', error);
    process.exit(1);
  }
}

activateLivingCity();