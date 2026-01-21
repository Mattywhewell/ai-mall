# Lint Issue Report Summary

Generated: 2026-01-19T13:28:18.209Z

Source: scripts/lint-issue-report.md

Total issues (Error + Warning): 1865

- Errors: 901

- Warnings: 964

## Top folders (by issue count)

- components/SpatialCommons.tsx: 57
- components/RoleGuard.tsx: 34
- lib/auth/AuthContext.tsx: 33
- lib/autonomous/plugin-system.ts: 33
- lib/permissions/permission-system.ts: 30
- app/admin/dashboard/page.tsx: 29
- lib/autonomous/core.ts: 29
- app/city/CityGateScene.tsx: 27
- components/3d/admin/SpatialCommonsAdmin.tsx: 22
- components/3d/SceneEditor.tsx: 22
- lib/ai-city/temporal-magic.ts: 22
- lib/services/auto-listing-engine.ts: 22
- components/visual-layer/Renderer.tsx: 21
- lib/sound/SoundManager.tsx: 21
- lib/autonomous/social-media-engine.ts: 18
- lib/autonomous/personalization-engine.ts: 17
- app/api.disabled/admin/commerce-engine/advanced/route.ts: 16
- lib/autonomous/product-intelligence.ts: 16
- app/api.disabled/collections/[slug]/route.ts: 15
- lib/ai/3d-generation.ts: 15

## Top rules (by occurrence)

- @typescript-eslint/no-explicit-any: 648
- no-unused-vars: 532
- @typescript-eslint/no-unused-vars: 432
- no-undef: 202
- no-empty: 17
- no-case-declarations: 15
- @typescript-eslint/no-require-imports: 4
- @typescript-eslint/no-empty-object-type: 4
- the: 3
- no-useless-escape: 2
- if: 1
- no-control-regex: 1
- no-self-assign: 1
- no-constant-binary-expression: 1
- (unknown): 1
- previous: 1

## Top files (by issue count)

- components/SpatialCommons.tsx: 57
- components/RoleGuard.tsx: 34
- lib/auth/AuthContext.tsx: 33
- lib/autonomous/plugin-system.ts: 33
- lib/permissions/permission-system.ts: 30
- app/admin/dashboard/page.tsx: 29
- lib/autonomous/core.ts: 29
- app/city/CityGateScene.tsx: 27
- components/3d/admin/SpatialCommonsAdmin.tsx: 22
- components/3d/SceneEditor.tsx: 22
- lib/ai-city/temporal-magic.ts: 22
- lib/services/auto-listing-engine.ts: 22
- components/visual-layer/Renderer.tsx: 21
- lib/sound/SoundManager.tsx: 21
- lib/autonomous/social-media-engine.ts: 18
- lib/autonomous/personalization-engine.ts: 17
- app/api.disabled/admin/commerce-engine/advanced/route.ts: 16
- lib/autonomous/product-intelligence.ts: 16
- app/api.disabled/collections/[slug]/route.ts: 15
- lib/ai/3d-generation.ts: 15
- app/admin/payouts/page.tsx: 14
- app/api.disabled/consciousness/match-curator/route.ts: 14
- app/api.disabled/digital-products/generate/route.ts: 14
- app/api.disabled/subscriptions/route.ts: 13
- app/ai-city/explore/page.tsx: 12
- app/api/admin/security-monitoring/route.ts: 12
- app/api/ci-prefetch/route.ts: 12
- app/api.disabled/stripe/webhook/route.ts: 12
- app/districts/[slug]/page.tsx: 12
- app/products/[id]/page.tsx: 12

## Notes & recommended first targets

- Focus initial cleanup on the top folders above (high volume).
- Prioritize fixing `@typescript-eslint/no-explicit-any`, `no-unused-vars`, and `no-undef` occurrences as they are widespread.
- Move generated/playwright artifacts to `artifacts/` and add to `.eslintignore` to reduce noise.
- Use incremental PRs limited to 1-3 files or one folder at a time.