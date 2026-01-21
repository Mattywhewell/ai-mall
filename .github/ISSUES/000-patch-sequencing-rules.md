# Patch Sequencing Rules

Goal: provide deterministic rules for ordering multiple patches when several findings touch related objects.

Principles
- Sequence by classification priority: **Additive → Corrective → Destructive**.
- Within each classification, sequence by dependency graph: upstream objects (types, core tables) before downstream (functions, views, policies).
- Prefer small, atomic patches; avoid large combined migrations.

Sequencing algorithm (conceptual)
1. Group findings by classification and dependency graph.
2. Within Additive: apply creations that enable Corrective changes (e.g., create missing enum before altering functions that use it).
3. Apply Corrective changes next; ensure staging verification and re-introspection after each related group.
4. Schedule Destructive patches last and only after backups, maintenance windows, and explicit sign-off.
5. After each stage, re-run introspection and validate that previously targeted findings are resolved and no new regressions appear.

Edge cases & strategies
- Transitive dependencies: when A depends on B which depends on C, apply C → B → A using small patches and re-introspection between steps.
- Parallel patches: non-dependent additive patches can be applied in parallel; coordinate corrective and destructive patches to avoid conflicts.
- Blocking issues: if a Corrective fix depends on a Destructive change, prefer to refactor to a temporary compatibility layer and split into smaller steps.

Post-merge validation
- After each merged patch group, run re-introspection and attach the output to the originating PR/issue.
- If drift is detected, create follow-up findings rather than rolling back automatically, unless destructive errors occurred.

Short summary: sequence by risk then by dependency, validate frequently, and prefer many small, reversible steps.