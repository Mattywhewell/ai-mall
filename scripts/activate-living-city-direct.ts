import { config } from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log('🚀 Starting Living City Engine with direct database access...');

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test database connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('citizen_states').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Simple citizen spawning function
async function spawnCitizen() {
  const citizenId = `citizen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const citizen = {
    id: citizenId,
    name: `Citizen ${citizenId.split('_')[2]}`,
    personality: {
      traits: ['curious', 'creative', 'social'],
      voice_style: 'warm',
      interests: ['art', 'technology', 'community'],
      fears: ['isolation', 'failure']
    },
    current_mood: {
      valence: 0.8,
      arousal: 0.6,
      dominant_emotion: 'joy'
    },
    position: {
      x: Math.random() * 100,
      y: Math.random() * 100,
      z: 0,
      district: 'innovation_district'
    },
    current_activity: {
      type: 'exploring',
      description: 'Discovering the city',
      duration: 30
    },
    schedule: {
      daily_routine: ['waking', 'exploring', 'socializing', 'creating', 'resting'],
      current_phase: 'exploring'
    },
    memories: [],
    relationships: {},
    energy: 85.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('citizen_states').insert(citizen);

  if (error) {
    console.error('❌ Failed to spawn citizen:', error.message);
    return null;
  }

  console.log(`✅ Spawned citizen: ${citizenId}`);
  return citizen;
}

// Main activation function
async function activateLivingCity() {
  console.log('🏙️ Activating Living City Engine...');

  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot proceed without database connection');
    return;
  }

  // Spawn initial citizens
  console.log('🚶 Spawning initial citizens...');
  for (let i = 0; i < 3; i++) {
    await spawnCitizen();
  }

  // Start periodic updates
  console.log('🔄 Starting autonomous updates...');
  setInterval(async () => {
    // Spawn a new citizen occasionally
    if (Math.random() < 0.3) { // 30% chance every 30 seconds
      await spawnCitizen();
    }

    // Update citizen moods randomly
    const { data: citizens } = await supabase
      .from('citizen_states')
      .select('id, current_mood')
      .limit(5);

    if (citizens) {
      for (const citizen of citizens) {
        const newMood = {
          valence: Math.max(0.1, Math.min(1.0, citizen.current_mood.valence + (Math.random() - 0.5) * 0.2)),
          arousal: Math.max(0.1, Math.min(1.0, citizen.current_mood.arousal + (Math.random() - 0.5) * 0.2)),
          dominant_emotion: ['joy', 'curiosity', 'contentment', 'excitement'][Math.floor(Math.random() * 4)]
        };

        await supabase
          .from('citizen_states')
          .update({
            current_mood: newMood,
            energy: Math.max(10, Math.min(100, citizen.energy + (Math.random() - 0.5) * 10)),
            updated_at: new Date().toISOString()
          })
          .eq('id', citizen.id);
      }
    }

    console.log('🔄 City state updated');
  }, 30000); // Every 30 seconds

  console.log('✅ Living City Engine activated successfully!');
  console.log('🏙️ The city is now alive with autonomous citizens');
  console.log('Press Ctrl+C to stop');
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down Living City Engine...');
  process.exit(0);
});

activateLivingCity().catch(console.error);