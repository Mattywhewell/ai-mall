#!/usr/bin/env node
/*
  scripts/supabase-create-bucket.js
  - Creates a Supabase storage bucket (if missing)
  - Optionally makes it public with --public
  - Creates placeholder objects to establish prefixes (shaders/, luts/, previews/, tmp/)

  Usage:
    SUPABASE_SERVICE_ROLE_KEY=<key> NEXT_PUBLIC_SUPABASE_URL=<url> node scripts/supabase-create-bucket.js [--public]
*/

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'visual-layers';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE URL or SUPABASE_SERVICE_ROLE_KEY in env. Aborting.');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  try {
    const publicFlag = process.argv.includes('--public');

    console.log(`Ensuring bucket: ${bucket} (public: ${publicFlag})`);

    const { data: createData, error: createErr } = await supabase.storage.createBucket(bucket, { public: publicFlag });
    if (createErr) {
      // If bucket exists, Supabase may return an error; detect common signs and continue
      console.warn('Create bucket response error (may already exist):', createErr.message || createErr);
    } else {
      console.log('Bucket created:', createData);
    }

    // Create prefixes by uploading small '.keep' placeholders so folders appear in the UI
    const prefixes = ['shaders/.keep', 'luts/.keep', 'previews/.keep', 'tmp/.keep'];

    for (const p of prefixes) {
      const buf = Buffer.from('.keep');
      const { error: upErr } = await supabase.storage.from(bucket).upload(p, buf, { upsert: true });
      if (upErr) {
        console.warn(`Could not create prefix ${p}:`, upErr.message || upErr);
      } else {
        console.log(`Created placeholder for ${p}`);
      }
    }

    console.log('\nDone. Next recommended steps:');
    console.log('- Review the bucket in the Supabase UI (Storage → Buckets → ' + bucket + ')');
    console.log('- Configure lifecycle rules for test artifacts and unreferenced objects (e.g., prefix tmp/ or objects older than X days)');
    console.log('- For private buckets, use signed URLs for serving raw assets and public for small previews/thumbnails');
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

run();
