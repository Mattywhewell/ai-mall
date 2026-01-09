Supabase Storage — bucket setup & playbook

This short playbook shows recommended steps to create a Supabase storage bucket for the visual layers system and some production hardening tips.

1) Basic bucket creation

- Preferred bucket name: `visual-layers` (override with `SUPABASE_STORAGE_BUCKET` env var).

CLI (supabase CLI)
- Public previews:
  - `supabase storage create-bucket visual-layers --public`
- Private bucket:
  - `supabase storage create-bucket visual-layers`

Node (using repo helper script)
- Make sure env vars are set: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Run the helper (creates prefixes and placeholders):
  - `node scripts/supabase-create-bucket.js --public` (add `--public` for public previews)
  - On Windows PowerShell: `.\scripts\create-supabase-bucket.ps1 -Public`

2) ACL recommendations

- Previews / thumbnails: public (eases embedding in UI without signed URLs).
- Raw assets (shader source files, LUTs): private + served via signed URLs or authenticated endpoints.

3) Lifecycle rules & test artifacts

- Create lifecycle rules to auto-delete objects under `tmp/` or older than a retention period (e.g., 30–90 days).
- For CI uploads, use a dedicated prefix (`tmp/tests/`) and policies that prune objects older than N days.
- Supabase currently supports lifecycle rules from the Storage UI — go to Storage → Buckets → {bucket} → Lifecycle to configure.
5) Verify signed URL behavior

- For private buckets, confirm that objects are not publicly accessible and that signed URLs grant time-limited access.
- Use the helper `npm run verify:supabase-bucket` with `EXPECT_PUBLIC=false` to assert private behavior and validate that a signed URL returns HTTP 200 for preview objects.
- To validate signed URL expiry, set `SIGNED_EXPIRY_CHECK=true` and `SIGNED_URL_TTL=<seconds>` (default `7`). The verifier will request the signed URL immediately, wait `TTL+2` seconds, and assert the signed URL is no longer valid.
- When dispatching the scheduled verification with `public=true`, the same helper checks public accessibility and verifies signed URLs as well.
4) Security & operational best practices

- Store keys/tokens in repository secrets or environment variables; never check them into source control.
- Prefer signed upload URLs or role-based permission over shared static tokens where possible.
- Rotate `UPLOAD_SECRET_TOKEN` and service role keys periodically.
- Use prefixes (`shaders/`, `luts/`, `previews/`) to scope fine-grained policies and lifecycle rules.

5) Verification checklist

- [ ] Bucket exists and prefixes created
- [ ] Previews are viewable (if public) via a sample URL
- [ ] Private assets are served via signed URLs
- [ ] Lifecycle rule for `tmp/` is configured
- [ ] Token rotation and access audit completed

If you'd like, I can add a CI job that uses the helper script to ensure the bucket exists in staging, or create a small test that uploads to `tmp/tests/` and confirms lifecycle behavior.