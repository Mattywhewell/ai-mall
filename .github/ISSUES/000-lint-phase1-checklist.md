# Phase 1 Checklist — High-impact, low-risk cleanup (detailed)

Summary
-------
This checklist breaks out Phase 1 into small, reviewable tasks (1–3 files each) targeting the highest-volume, lowest-risk fixes from the triage summary. Each checklist item is self-contained and safe to land while the introspection/SQL work is ongoing.

How to claim a task
-------------------
Comment on Issue #45 with: `claim: <task-number> — @your-handle` and a short ETA. PRs should use branch name `chore/cleanup/<area>/<short-description>` and include the label `cleanup`.

Acceptance criteria for Phase 1 PRs
-----------------------------------
- Only lint/type fixes (no behavioral changes) unless adding small tests demonstrating behavior.
- CI passes (lint & typecheck).
- PR size: 1–3 files, clear description of rules fixed, and link back to Issue #45.

Priority targets (derived from the triage summary)
-------------------------------------------------
Top hotspots to pick from (start here):
1. `components/SpatialCommons.tsx` — fix unused vars, tighten types, remove `any`. (Expected: 1–2 PRs)
2. `components/RoleGuard.tsx` — add explicit types, fix `no-explicit-any` & `no-undef` (Expected: 1 PR)
3. `lib/auth/AuthContext.tsx` — replace `any` with proper interfaces, fix React no-undef imports (Expected: 1 PR)
4. `lib/autonomous/plugin-system.ts` — add types to plugin interfaces, remove `any` (Expected: 1–2 PRs)
5. `lib/permissions/permission-system.ts` — remove unused consts, add missing typings (Expected: 1 PR)
6. `app/admin/dashboard/page.tsx` — remove unused values, add explicit prop types (Expected: 1 PR)
7. `lib/autonomous/core.ts` — fix common `any` hotspots and document areas that need deeper refactors (Expected: 1–2 PRs)
8. `app/city/CityGateScene.tsx` — fix unused vars and type gaps (Expected: 1 PR)
9. `components/3d/admin/SpatialCommonsAdmin.tsx` and `components/3d/SceneEditor.tsx` — cleanup JS/TS mismatches and unused vars (1–2 PRs)
10. `lib/services/auto-listing-engine.ts` — add precise interfaces for API responses; remove `any` (Expected: 1–2 PRs)

Per-task checklist (example template)
------------------------------------
- [ ] Task: `components/SpatialCommons.tsx` — remove unused vars & replace `any` types
  - Scope: 1–2 small PRs
  - Steps:
    1. Run `npm run dev:check` locally for the file to get the failing lines.
    2. Replace `any` with `unknown` or explicit interfaces; add type guards where needed.
    3. Remove or use unused variables; if unused by design, add a short comment explaining why or prefix with `_`.
    4. Run `npm run dev:check` to verify the file is clean.
    5. Open PR with description: "chore(cleanup): fix lint/type in components/SpatialCommons.tsx — remove unused vars, add types"
  - Acceptance: CI green, no behavior changes, small and focused.

Guardrails & process notes
-------------------------
- If a change requires nontrivial refactors (beyond typing), mark it `needs-discussion` and discuss in the issue first.
- Add tests only when necessary to assert behavior; avoid changing logic in these PRs.
- Add the `cleanup` label to every PR and reference the task number in the PR body.

Tooling & repo hygiene
----------------------
- Add common generated artifact paths to `.eslintignore` (e.g., `playwright-report/**`, `tmp-ci-artifacts/**`) to reduce noise.
- Add `lint-staged` to `package.json` and a small `husky` pre-commit hook to run `prettier --write` + `eslint --fix` on staged files (separate follow-up PR).

Estimated Phase 1 timeline
--------------------------
- Triage/assignment: 1–2 days
- Each small PR: 2–6 hours
- Phase 1 completion (pick 6–10 top tasks): ~1–2 weeks depending on parallel contributors

If you want, I can prepare the first task PR for `components/SpatialCommons.tsx` as a model PR once you say "go".

---

(Linked to Issue: https://github.com/Mattywhewell/ai-mall/issues/45)