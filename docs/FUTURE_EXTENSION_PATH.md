# Future extension path — SQL-patch arc roadmap

This file sketches a minimal, pragmatic roadmap for how the parser → validator → sequencer arc should evolve as the ecosystem grows. It is intentionally small, focused, and ready to activate when needed.

## 1. Multi-stream artifact validation (nightly, release, hotfix) 🔁
- Branch validation by artifact stream to avoid mixing signals:
  - `introspection-findings.json` (release)
  - `introspection-findings-nightly.json` (nightly)
  - `introspection-findings-hotfix.json` (hotfix)
- Each stream gets its own workflow trigger and asset pattern, allowing separate policies and SLAs.

## 2. Schema versioning + compatibility matrix 📚
- Maintain versioned schemas: `parser-output.schema.v1.json`, `parser-output.schema.v2.json`, etc.
- Add a small compatibility matrix documenting which sequencer versions support which schema versions.
- Consider a migration guide and a deprecation policy for older schema versions.

## 3. Auto-normalization layer (shock absorber) ⚖️
- Centralize normalization of fields (e.g., `name` → `object_name`, `estimated_impact` → `impact`, `affected` → `affects`).
- Add rules for bounding/normalizing: `confidence` (0–100), `impact` → canonical enum, `object_type` canonicalization.
- Keep normalization idempotent and well-tested.

## 4. Cross-artifact validation (multi-file consistency) 🔍
- When parser emits multiple files (e.g., `schema.json`, `tables.json`, `indexes.json`, `constraints.json`) add cross-file checks to ensure:
  - No orphaned references
  - No contradictory findings
  - No cross-file cycles
- Implement a graph validator that can reason across these files and report human-actionable errors.

## 5. Sequencer dry-run mode in CI 🛩️
- Add a CI step that runs the sequencer on a validated artifact and asserts:
  - no cycles
  - no destructive patches without manual sign-off
  - expected phase grouping
- Emit machine-readable plans (JSON) and human-readable summaries to the run logs.

## 6. Release notes auto-generation 📝
- Use the sequencer output to synthesize release notes:
  - Additive patches
  - Corrective patches
  - Destructive patches (require sign-off)
  - Cycle triage required
- Attach the plan to the release and post a summary comment.

## 7. Full pipeline activation (goal state) 🚦
- End-to-end: introspection → parser → validator → sequencer → patch plan → execution
- Post-release behavior:
  - Validate the artifact
  - Run sequencer and attach execution plan
  - Open triage issues for cycles or destructive items
  - Optionally gate execution behind approvals for high-risk patches

## 8. Semantic diffing (historical drift detection) 🔬
- Compare snapshots to detect:
  - Drift
  - New regressions
  - Schema churn
- Use diffs to prioritize patches and reduce thrash.

---

Notes
- This roadmap favors small, well-scoped increments that can be enabled as parser output and usage patterns mature.
- I can expand any section into a concrete implementation plan, tests, and workflow templates on request.
