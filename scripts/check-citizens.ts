import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables FIRST
const envPath = path.join(__dirname, '../.env.local');
config({ path: envPath });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkCitizenStatus() {
  console.log('🔍 Checking citizen status...');

  const { data: citizens, error } = await supabase
    .from('citizen_states')
    .select('id, name, current_activity, energy, updated_at')
    .limit(12);

  if (error) {
    console.error('Error fetching citizens:', error);
    return;
  }

  console.log(`📊 Found ${citizens?.length || 0} citizens:`);
  citizens?.forEach(citizen => {
    const activity = citizen.current_activity?.type || 'unknown';
    const energy = citizen.energy;
    const updated = new Date(citizen.updated_at).toLocaleTimeString();
    console.log(`  ${citizen.name}: ${activity} (energy: ${energy}, updated: ${updated})`);
  });
}

checkCitizenStatus().catch(console.error);