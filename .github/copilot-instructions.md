# Copilot instructions — AI coding agents

Purpose: give precise, discoverable context so a coding agent is immediately productive in this repository.

## Quick orientation
- What this is: a Next.js 15 + TypeScript monorepo that implements an autonomous AI-native e-commerce platform (see `README.md`).
- Most important folders to scan first: `app/` (Next.js App Router + `app/api/*` routes), `lib/` (AI logic under `lib/ai/*`, autonomous engines under `lib/autonomous/*`), `scripts/`, and SQL migrations `supabase-*.sql`.

## Local dev & environment
- Node >= 18. Install: `npm install`.
- Copy env: `cp .env.local.example .env.local` and fill keys: `OPENAI_API_KEY`, Supabase keys, optional `REDIS_URL`, `RESEND_API_KEY`, `STRIPE_*`.
- Useful commands:
  - `npm run dev` — start Next.js locally (port 3000).
  - `npm run setup:check` — verify env is usable.
  - `npm run generate-embeddings` — bulk embedding generation (`scripts/generate-embeddings.ts`).
  - `npm run setup:supabase-bucket` / `npm run verify:supabase-bucket` — bucket setup scripts.

## Testing & CI
- Unit tests: `npm run test:unit` (Vitest).
- E2E: `npm run test:e2e` (Playwright). Tests frequently mock API responses using `page.route('**/api/**'...)`—check `tests/e2e` for patterns.
- Security tests: `npm run test:enhanced-security` (validates rate limiting + permissions).
- CI workflows live in `.github/workflows/` (unit-tests, integration-tests, playwright). Run locally before PRs.

## AI / Agent specifics (must-read)
- AI logic: `lib/ai/*` (OpenAI client in `lib/ai/openaiClient.ts`), prompts and templates are implemented inside `lib/ai/*` and `app/api/admin/prompts/*`.
- Embeddings: code expects `text-embedding-3-small` family; generation script is `scripts/generate-embeddings.ts` (ensure `OPENAI_API_KEY` and Supabase creds are set).
- Files to edit prompts & prompt versions: `lib/ai/*`, `app/api/admin/prompts/*`, and migrations like `supabase-prompt-versioning-migration.sql` (prompt versioning is enforced by DB policies).
- Agent DB model & policies:
  - Tables: `shopping_agents`, `agent_conversations`, `agent_recommendations` (see `supabase-v5.1-schema-fixed.sql`, `supabase-complete-migration.sql`).
  - RBAC & RLS: `supabase-rbac-schema.sql` contains `ai_agent` role and policies. Do not assume full DB privileges for `ai_agent`—use API endpoints or server-side code when elevated access is required.
- Verify & auth endpoints: `app/api/verify-ai-keys/route.ts` and `app/api/ai-city/*` for multi-agent flows.
- Quick test tip: Playwright tests often mock network responses like:
  `await page.route('**/api/telemetry/hero-event', route => route.fulfill({ status: 200, body: 'OK' }))` — follow existing `tests/e2e` examples when adding coverage.

## Background jobs & cron
- Job runner/lib: `lib/autonomous/job-runner.ts`, `lib/jobs/worker.ts` and many `lib/autonomous/*` engines (merchandising, social, etc.).
- Cron jobs scheduled in `vercel.json` (e.g., `/api/cron/update-world` every 3 hours). For local testing, POST to these endpoints manually if implemented.

## Integrations to know
- Supabase (DB + RLS + pgvector), OpenAI (GPT + embeddings), Stripe (payments and webhooks), Redis (optional for rate-limiting), channel adapters (e.g., `lib/channel-adapters/*` for Shopify, Amazon, CJ).
- When adding adapter changes, check `lib/channel-adapters` and existing tests under `tests/` and `app/api/seller/*`.

## Common patterns & conventions
- API routes: use App Router `app/api/**/route.ts` files. Changes to public API should be accompanied with tests in `tests/integration` or `tests/e2e`.
- One-off / maintenance scripts use `tsx` in `scripts/` and are invoked via package.json scripts (see `package.json`).
- Database migrations: add SQL to matching `supabase-*.sql` and include seed data if needed. Always keep RLS policies in mind when adding agent-facing features.
- AI prompt changes are code + DB-driven: update both `lib/ai/*` and prompt versioning tables (prompt versioning migrations and `app/api/admin/prompts/*`).

## Fast recipe examples
- Trigger auto-listing extraction:
  curl -X POST http://localhost:3000/api/auto-listing/extract -H "Content-Type: application/json" -d '{"product_url":"https://example-cj-product.com/item/123","supplier_id":"cj_supplier_id_1"}'

- Manually run evolution jobs:
  curl -X POST http://localhost:3000/api/world/evolution

- Generate embeddings:
  npm run generate-embeddings

## What to watch out for (risk areas)
- Changes to RLS/migrations or public API routes; they affect production behavior and agent access.
- Prompt edits impact autonomous systems (merchandising, recommendations). Run E2E to validate effects.
- Third-party integrations (Stripe webhooks, external channel adapters) often require local forwarding (e.g., `stripe listen --forward-to localhost:3000/api/stripe/webhook`).

## Files to review for context while coding
- `README.md`, `QUICK_START.md`, `COMPLETE_SETUP_GUIDE.md`
- `lib/ai/*`, `lib/autonomous/*`, `lib/services/*`
- `app/api/**/route.ts` endpoints for public API surface
- `supabase-*.sql` (schema, RLS, seeds)
- `.github/workflows/*` (CI expectations)

---
If a requested change touches AI prompts, agent tables, migrations, or public APIs, include: (1) a small test demonstrating behavior change, (2) updated migration or seed SQL when adding tables/columns, and (3) a short note in PR description summarizing runtime impact.

If anything is unclear or you want this tuned for a specific agent persona (e.g., more secure-safety checks, or focusing on autonomous/job code), tell me which focus and I'll refine. :sparkles: