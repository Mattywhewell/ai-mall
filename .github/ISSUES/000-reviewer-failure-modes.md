# Reviewer Failure Modes — How to catch common misclassifications

Purpose: short guide to the usual mistakes reviewers make and pragmatic checks to catch them early.

Common failure modes

1. **Misclassifying multi-step changes as single-type**
- Symptom: PR adds a type and also alters behavior in a way that could be destructive.
- Catch: check whether all changes are independent; if not, require splitting and classify each part separately.

2. **Underestimating hidden data transformations**
- Symptom: an `ALTER TYPE` or `ALTER COLUMN` is treated as Corrective but implicitly requires data migration.
- Catch: request explicit data-transform scripts and a backup; require staging run and data verification queries.

3. **Assuming idempotency without proof**
- Symptom: relies on `IF NOT EXISTS` but the logic contains volatile steps that break on re-run.
- Catch: ask for a documented idempotency proof and local dry-run results in PR body.

4. **Missing dependent objects or policies**
- Symptom: patch fixes a function but not the dependent RLS policy or triggers that remain broken.
- Catch: run a dependency scan (list functions/views/triggers referencing the changed object) and include them in verification steps.

5. **Insufficient rollback plan for destructive changes**
- Symptom: destructive PR lacks backups, or the rollback is non-trivial but undocumented.
- Catch: require concrete backup commands, expected size, and an explicit restore plan before approval.

Reviewer checklist to avoid failure modes
- Confirm single-purpose scope or require split PRs.
- Ask for local + staging dry-run outputs and re-introspection results.
- Verify idempotency arguments with concrete examples.
- Check dependency graph for related objects and policies.
- Ensure rollback steps and monitoring instructions are present for destructive patches.

Short note: When in doubt, downgrade classification and require human triage — it’s safer to pause than to guess.