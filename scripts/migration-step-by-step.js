#!/usr/bin/env node

/**
 * 3D Assets Migration - Step by Step Execution Guide
 * Provides individual SQL statements for manual execution
 */

const fs = require('fs');
const path = require('path');

console.log('🔮 AIVERSE 3D ASSETS MIGRATION - STEP BY STEP');
console.log('==============================================\n');

console.log('📋 EXECUTION INSTRUCTIONS:');
console.log('1. Open Supabase SQL Editor');
console.log('2. Copy ONE statement at a time');
console.log('3. Click "Run" (NOT "Explain")');
console.log('4. Repeat for each statement below\n');

console.log('⚠️  IMPORTANT:');
console.log('• Execute statements in order');
console.log('• Some may show "already exists" - this is normal');
console.log('• Do NOT use "Explain" - use "Run"');
console.log('• If a statement fails, continue with the next one\n');

console.log('='.repeat(80));

// Read and split the migration file
const migrationPath = path.join(__dirname, '..', 'supabase-3d-assets-creation-migration.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Split by semicolons and clean up
const statements = migrationSQL
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

console.log('📜 INDIVIDUAL SQL STATEMENTS TO EXECUTE:\n');

statements.forEach((statement, index) => {
  console.log(`🔄 STATEMENT ${index + 1}/${statements.length}`);
  console.log('-'.repeat(50));
  console.log(statement + ';');
  console.log('');
  console.log('💡 Copy the above statement and run it in Supabase SQL Editor');
  console.log('   Then press Enter to see the next statement...\n');

  // For interactive mode, you could add readline here
  // But for now, we'll just output all statements
});

console.log('='.repeat(80));
console.log('✅ AFTER EXECUTING ALL STATEMENTS:');
console.log('   node scripts/quick-api-test.js');
console.log('');
console.log('🎯 This will create:');
console.log('   • assets table (3D models, scenes, avatars)');
console.log('   • uploads table (file processing)');
console.log('   • Extended profiles table with avatar support');
console.log('   • RLS policies and storage buckets');