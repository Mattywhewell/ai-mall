import * as dotenv from 'dotenv';
import { citizenAIService } from '../lib/ai-city/citizen-ai-service';

// Load environment variables FIRST
const envPath = require('path').join(__dirname, '../.env.local');
dotenv.config({ path: envPath });

async function spawnInitialCitizens() {
  console.log('🌱 Spawning initial citizens to populate the city...');
  console.log('Environment check:');
  console.log('- SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
  console.log('- SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');

  const districts = [
    'innovation_district',
    'wellness_way',
    'neon_boulevard',
    'makers_sanctuary'
  ];

  const citizensPerDistrict = 3; // Spawn 3 citizens per district

  try {
    for (const district of districts) {
      console.log(`🏙️ Spawning citizens in ${district}...`);

      for (let i = 0; i < citizensPerDistrict; i++) {
        // Generate random position within district bounds
        const position = {
          x: Math.random() * 100 - 50, // -50 to 50
          y: 0,
          z: Math.random() * 100 - 50  // -50 to 50
        };

        const citizenId = await citizenAIService.spawnCitizen(district, position);
        console.log(`✅ Spawned citizen ${citizenId} in ${district}`);
      }
    }

    console.log('🎉 Initial citizen spawning complete!');
    console.log(`📊 Total citizens spawned: ${districts.length * citizensPerDistrict}`);

  } catch (error) {
    console.error('❌ Error spawning citizens:', error);
  }
}

spawnInitialCitizens();