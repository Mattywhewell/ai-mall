#!/usr/bin/env node

/**
 * 3D Assets Migration Helper
 * Outputs the migration SQL for manual application in Supabase
 */

const fs = require('fs');
const path = require('path');

console.log('🔮 AIVERSE 3D ASSETS MIGRATION');
console.log('==============================\n');

console.log('📋 MANUAL APPLICATION REQUIRED');
console.log('Due to Supabase security policies, DDL operations must be applied manually.\n');

console.log('📖 INSTRUCTIONS:');
console.log('1. Open your Supabase project dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy the SQL below');
console.log('4. Paste into the SQL Editor');
console.log('5. Click "Run" to execute\n');

console.log('='.repeat(80));
console.log('COPY THE SQL BELOW THIS LINE');
console.log('='.repeat(80));
console.log('');

// Read and output the migration file
const migrationPath = path.join(__dirname, '..', 'supabase-3d-assets-creation-migration.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log(migrationSQL);

console.log('');
console.log('='.repeat(80));
console.log('COPY THE SQL ABOVE THIS LINE');
console.log('='.repeat(80));
console.log('');

console.log('✅ After applying the migration:');
console.log('   node scripts/quick-api-test.js');
console.log('');
console.log('🎯 This will create:');
console.log('   • assets table (3D models, scenes, avatars)');
console.log('   • user_avatars table (avatar generation tracking)');
console.log('   • uploads table (file processing)');
console.log('   • RLS policies for security');
console.log('   • Indexes for performance');