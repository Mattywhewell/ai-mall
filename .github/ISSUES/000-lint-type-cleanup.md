Title: Lint & Type Cleanup (prioritized, incremental plan)

Short description
-----------------
This issue tracks a prioritized plan to fix the repository-wide ESLint and TypeScript problems surfaced by `npm run dev:check`. The goal is to acknowledge the systemic problem, avoid large risky PRs, and sequence small, reviewable cleanup PRs that don't block ongoing work (like the introspection/SQL patch arc).

Why this is important ✅
- Acknowledges the systemic problem without blocking current work.
- Produces a clear, reviewable roadmap rather than a giant PR that is hard to review.
- Lets us sequence cleanup in small, safe batches once the introspection/SQL work is complete.
- Avoids mixing unrelated lint fixes into feature PRs.

Scope
-----
- Fix errors (ESLint errors, TypeScript errors flagged by `npm run dev:check`) across the codebase in prioritized batches.
- Do not change behavior; prefer type narrowing, explicit types, and small refactors where necessary.
- Keep PRs small (1–3 files or 1 feature area per PR) and include a test where applicable.

Acceptance criteria 🎯
- Each cleanup PR fixes only lint/type issues and includes a short PR description listing what rules were fixed.
- CI remains green; no runtime behavior changes introduced without tests.
- Files or modules that are intentionally deferred are documented and triaged.

Prioritization & plan (short, actionable) 🔧
1. Triage pass (1 day)
   - Run `npm run dev:check` and capture the current set of errors into `scripts/lint-issue-report.md` (automated snapshot).
   - Group errors by rule and by top-level folder (e.g., `lib/ai/*`, `lib/db/*`, `scripts/*`, `components/*`).
   - Tag top 5 highest-impact folders (by count + risk) as Phase 1.

2. Phase 1: High-impact, low-risk conversions (2–4 PRs, 1–2 days each)
   - Target `lib/ai/*` and `lib/db/*` (or the top folders determined above).
   - Fix `no-explicit-any` by adding explicit types or `unknown` + type guards; replace `@ts-ignore` with `// @ts-expect-error` where appropriate.
   - Remove unused variables, replace `require()` with `import` where project style requires it.
   - Add unit tests for any behavior-sensitive changes.

3. Phase 2: Supporting areas (3–6 PRs)
   - Tackle `components/*`, `scripts/*`, and `lib/services/*`.
   - Focus on `no-undef`, `no-unused-vars`, and `no-empty` issues.
   - Where large third-party blobs (e.g., playwright trace files) cause noise, add `.eslintignore` or move generated assets out of source tree.

4. Phase 3: Lower priority / sweeping fixes
   - Add or tighten ESLint rules only after bulk cleanup; enable `@typescript-eslint/no-explicit-any` fully in the areas we've cleaned.
   - Add `lint-staged` to run format/lint on staged files to keep repo healthy.

Process & Guardrails ✅
- Make each change a focused PR with a short description and the `lint/type cleanup` label.
- Keep PRs small and reviewable. Prefer many small PRs to a single giant PR.
- Document any large or risky changes in PR description and add `needs-cherrypick`/`needs-backport` labels if needed.
- If generated files create noise in lint, move them to `artifacts/` and add to `.eslintignore`.

Estimated timeline & effort
--------------------------
- Triage pass: 1 day
- Phase 1: 1–2 weeks (parallel small PRs)
- Phase 2: 2–4 weeks
- Phase 3: ongoing maintenance

Next steps (short)
------------------
1. Keep this issue file as the single source-of-truth; update it with the triage snapshot and Phase 1 target folders.
2. When introspection work quiets, start Phase 1 PRs in small batches.

---
Triage snapshot (attached): `scripts/lint-issue-report.md` — the snapshot contains the full `npm run dev:check` output and confirms a large, repo-wide problem set (approx. 23,343 problems: 21,354 errors, 1,989 warnings). See `scripts/lint-issue-report.md` in the repo for the full per-file breakdown and details.

If you'd like, I can:
- Run the triage snapshot and add `scripts/lint-issue-report.md` to this issue, or
- Open the first small PR focusing on one high-impact module (e.g., `lib/ai/*`) once you confirm.

---

Labels: `area:dx`, `cleanup`, `priority:high`, `status:triage`

Owner: @team (pick an owner when triage completes)
