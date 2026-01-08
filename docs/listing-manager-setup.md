# Listing Manager — Setup & Environment Variables

This document lists the required environment variables and quick setup steps to run the Listing Manager feature locally or in CI.

## Required Environment Variables

- ENCRYPTION_KEY - (required) Secret used to encrypt API keys and tokens (use a strong random value, 32+ bytes). Example: `export ENCRYPTION_KEY="$(openssl rand -hex 32)"`
- NEXT_PUBLIC_SITE_URL - (required) Public site URL used for OAuth redirects, e.g., `http://localhost:3000`
- NEXT_PUBLIC_SUPABASE_URL - (required) Supabase project URL
- SUPABASE_SERVICE_ROLE_KEY - (required) Supabase service role key with admin privileges for server tasks and tests

### Shopify
- SHOPIFY_API_KEY - (required for Shopify OAuth) Shopify app API key
- SHOPIFY_API_SECRET - (required for Shopify OAuth) Shopify app secret
- SHOPIFY_SCOPES - (optional) scopes the app will request (default set in code)

### eBay
- EBAY_CLIENT_ID - (required for eBay OAuth)
- EBAY_CLIENT_SECRET - (required for eBay OAuth)
- EBAY_SCOPES - (optional) OAuth scopes

### TikTok Shop
- TIKTOK_SHOP_CLIENT_ID - (required for TikTok Shop OAuth)
- TIKTOK_SHOP_CLIENT_SECRET - (required for TikTok Shop OAuth)
- TIKTOK_SHOP_SCOPES - (optional)

## Quick Start (local)

1. Set env variables (example using PowerShell or a .env file):
   - `ENCRYPTION_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, plus any OAuth client keys.
2. Run the Next.js dev server:
   - `npm run dev`
3. Go to the Listing Manager UI:
   - `http://localhost:3000/supplier/listing-manager`
4. For demo/testing without external credentials, use the **Connect Mock Channel** button in the Channel Connections UI to set up a mock store.
5. Enqueue sync jobs from the UI or via `POST /api/seller/jobs` and run the worker manually at `/api/seller/jobs/worker` (or use the provided demo script `npm run demo:mock-flow`).

## Testing
- Unit tests for adapters and utilities are in `tests/lib/`.
- Integration test for mock flow is in `tests/integration/mock_flow.spec.ts` and uses the Supabase admin API. Make sure `SUPABASE_SERVICE_ROLE_KEY` is set for the test runner.

## Notes & Next Steps
- The eBay and TikTok adapter implementations are intentionally simple and do not implement pagination, retry/backoff, or advanced rate-limit handling — these should be added for production use.
- Webhook endpoints (Shopify) are implemented. For eBay and TikTok webhooks, follow platform docs and add verification as appropriate.
- For production, store ENCRYPTION_KEY in a secure secret manager and rotate keys carefully (we recommend a KMS-based approach).
