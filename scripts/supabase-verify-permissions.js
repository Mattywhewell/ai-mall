#!/usr/bin/env node
/*
  scripts/supabase-verify-permissions.js
  - Verifies that a preview object is accessible according to expected ACL.
  - Usage:
      EXPECT_PUBLIC=true NEXT_PUBLIC_SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/supabase-verify-permissions.js
*/

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'visual-layers';
const previewKey = 'previews/.keep';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const expectPublic = (process.env.EXPECT_PUBLIC || 'false').toLowerCase() === 'true';

if (!url || !key) {
  console.error('Missing SUPABASE URL or SUPABASE_SERVICE_ROLE_KEY in env. Aborting.');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(previewKey);
    const publicUrl = data?.publicUrl || null;
    if (!publicUrl) {
      console.log('No public URL returned for preview. Treating as private.');
      if (expectPublic) {
        console.error('Expected public access but no public URL available.');
        process.exit(2);
      } else {
        console.log('Expected private; OK.');
        process.exit(0);
      }
    }

    console.log('Checking preview URL:', publicUrl);

    const resp = await fetch(publicUrl, { method: 'GET' });
    console.log('HTTP status:', resp.status);

    if (expectPublic) {
      if (resp.status === 200) {
        console.log('Public access verified (200).');
        // Also verify signed URL works as a sanity check
        const { data: signed, error: signedErr } = await supabase.storage.from(bucket).createSignedUrl(previewKey, 60);
        if (signedErr) {
          console.error('Failed to create signed URL:', signedErr.message || signedErr);
          process.exit(6);
        }
        const sresp = await fetch(signed.signedUrl, { method: 'GET' });
        if (sresp.status === 200) {
          console.log('Signed URL access verified (200) for public object.');
          process.exit(0);
        } else {
          console.error('Signed URL for public object did not return 200, got', sresp.status);
          process.exit(7);
        }
      } else {
        console.error('Expected public (200) but got', resp.status);
        process.exit(3);
      }
    } else {
      if (resp.status === 200) {
        console.error('Expected private but preview returned 200.');
        process.exit(4);
      } else {
        console.log('Private access confirmed (non-200). Attempting to create signed URL...');
        const { data: signed, error: signedErr } = await supabase.storage.from(bucket).createSignedUrl(previewKey, 60);
        if (signedErr) {
          console.error('Failed to create signed URL for private object:', signedErr.message || signedErr);
          process.exit(6);
        }
        const sresp = await fetch(signed.signedUrl, { method: 'GET' });
        console.log('Signed URL HTTP status:', sresp.status);
        if (sresp.status === 200) {
          console.log('Signed URL access verified (200) for private object.');
          process.exit(0);
        } else {
          console.error('Signed URL for private object did not return 200, got', sresp.status);
          process.exit(8);
        }
      }
    }
  } catch (err) {
    console.error('Error during permission verification:', err?.message || err);
    process.exit(5);
  }
}

run();
