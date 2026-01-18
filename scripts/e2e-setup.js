#!/usr/bin/env node
// E2E setup: idempotent seeding for Playwright CI
// Usage: node scripts/e2e-setup.js

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const { createClient } = require('@supabase/supabase-js');

async function fail(msg) {
  console.error('\n❌ ' + msg + '\n');
  process.exit(1);
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Treat as CI only when running in CI provider (GitHub Actions sets GITHUB_ACTIONS=true)
  const isCI = process.env.GITHUB_ACTIONS === 'true' || false;

  console.log('\n🧪 E2E Setup starting');
  console.log('────────────────────────\n');

  if (!supabaseUrl || !serviceKey) {
    const msg = 'Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).';
    if (isCI) {
      await fail(msg + ' Set them in your CI secrets (required for reliable E2E).');
    }
    console.warn(msg + ' Skipping seeding when running locally.');
    return;
  }

  // If the configured URL looks like a placeholder in local env, skip seeding to avoid noisy DNS failures
  if (!isCI && /example|dummy|local/i.test(supabaseUrl)) {
    console.warn('⚠️  Supabase URL looks like a placeholder (', supabaseUrl, '). Skipping seeding in local dev.');
    process.exit(0);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Sanity check connection
  try {
    const { error: pingErr } = await supabase.from('microstores').select('id').limit(1);
    if (pingErr && pingErr.message && pingErr.message.includes('does not exist')) {
      // Likely migrations not applied
      if (isCI) {
        await fail('Database schema not found. Run the migration/setup scripts first (see README).');
      } else {
        console.warn('⚠️  Database schema not present locally — run setup-database.js or apply migrations. Skipping seeding.');
        process.exit(0);
      }
    }
  } catch (err) {
    if (isCI) {
      await fail('Unable to connect to Supabase: ' + (err.message || err));
    }
    console.warn('⚠️  Unable to connect to Supabase locally; skipping seeding:', err && (err.message || err));
    process.exit(0);
  }

  // Idempotent upsert: create or find a dedicated microstore for E2E
  console.log('\n🔁 Ensuring E2E microstore "e2e-supplier" exists...');
  let msUpsert;
  try {
    msUpsert = await supabase
      .from('microstores')
      .upsert({ slug: 'e2e-supplier', name: 'E2E Supplier', description: 'Supplier used by E2E tests', category: 'E2E' }, { onConflict: 'slug' })
      .select('id')
      .limit(1);

    if (msUpsert.error) {
      throw msUpsert.error;
    }
  } catch (err) {
    // If we're in CI, treat this as a hard failure. Locally, warn and skip to avoid blocking dev workflow.
    if (isCI) {
      console.error('Supabase error upserting microstore:', err);
      process.exit(1);
    }
    console.warn('⚠️  Supabase seeding unavailable locally (skipping):', err && (err.message || JSON.stringify(err)));
    process.exit(0);
  }

  const microstoreId = msUpsert.data && msUpsert.data[0] && msUpsert.data[0].id;
  if (!microstoreId) {
    // Try to fetch
    const { data: found } = await supabase.from('microstores').select('id').eq('slug', 'e2e-supplier').limit(1);
    if (!found || !found[0]) {
      await fail('Unable to ensure microstore existence.');
    }
  }

  // Ensure a deterministic seeded product P1 exists
  console.log('🔁 Ensuring seeded product "P1" exists (visible to supplier listing manager)...');
  const existing = await supabase.from('products').select('id').eq('name', 'P1').limit(1);
  if (existing.error) {
    console.error('Supabase error reading products:', existing.error);
    process.exit(1);
  }

  if (!existing.data || existing.data.length === 0) {
    const insert = await supabase.from('products').insert([
      {
        name: 'P1',
        description: 'Deterministic seeded product for CI tests',
        price: 1.0,
        image_url: '/shader-previews/runic-medium.svg',
        tags: ['e2e', 'seed'],
        microstore_id: microstoreId || msUpsert.data[0].id,
      },
    ]);

    if (insert.error) {
      console.error('Supabase error inserting product:', insert.error);
      process.exit(1);
    }
    console.log('✅ Inserted seeded product P1');
  } else {
    console.log('✅ Product P1 already exists — skipping insert');
  }

  // Optionally: ensure a seeded price row for price-sync endpoints (some tests mock prices, but we still add a fallback)
  try {
    const { error: priceErr } = await supabase.from('prices').select('id').limit(1);
    if (!priceErr) {
      const pExists = await supabase.from('prices').select('id').eq('product_name', 'P1').limit(1);
      if (!pExists.data || pExists.data.length === 0) {
        await supabase.from('prices').insert([
          { product_name: 'P1', product_sku: 'SKU1', channel_name: 'E2E Mock', channel_price: 10.0, base_price: 9.0, sync_enabled: true, sync_status: 'synced' },
        ]);
        console.log('✅ Inserted seeded price record for P1 (prices table exists)');
      } else {
        console.log('✅ Price entry for P1 already present');
      }
    } else {
      // prices table may not exist; skip gracefully
      console.log('ℹ️  prices table not present, skipping seeded price row');
    }
  } catch (e) {
    console.log('ℹ️  Skipping prices seeding: ', e.message || e);
  }

  // Ensure deterministic test users & roles (admin, supplier, standard)
  try {
    const { ensureTestUsers } = require('./e2e-seeders');
    console.log('\n🔁 Ensuring deterministic test users and roles exist...');
    await ensureTestUsers(supabase, { log: console });
    console.log('✅ Test users & roles ensured');
  } catch (err) {
    if (isCI) {
      console.error('❌ Failed to seed test users:', err && (err.message || JSON.stringify(err)));
      process.exit(1);
    }
    console.warn('⚠️  Failed to seed test users locally — continuing:', err && (err.message || JSON.stringify(err)));
  }

  console.log('\n🎉 E2E seeding complete.');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ E2E setup failed:', err);
  process.exit(1);
});
