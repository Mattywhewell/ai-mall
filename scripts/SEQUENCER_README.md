Sequencer runner — one-line summary

A small Python reference sequencer that turns normalized parser output (the "findings JSON") into an ordered, phased patch plan suitable for human review and execution. It produces a deterministic patch ordering and phase plan for Additive → Corrective → Destructive classifications. See `scripts/sequencer_runner.py` for the runnable example and `scripts/tests` for tests.

Note: future multi-file introspection support (e.g., schema/tables/indexes bundles) will be integrated into `parse_json_findings` and cross-file dependency resolution — see `docs/FUTURE_EXTENSION_PATH.md` for the roadmap.

Signal Taxonomy

This sequencer emits machine- and human-readable signals when it ingests parser output. Use this shared vocabulary to interpret parser artifacts and prioritize follow-up work.

- Structural Signals
  - Describe the shape of the artifact and schema-level issues.
  - Examples: schema mismatch, missing fields, multi-file detection, invalid patch order.

- Semantic Signals
  - Convey meaning and intent inferred from findings.
  - Examples: patch classification (Additive/Corrective/Destructive), inferred relationships, dependency chains.

- Integrity Signals
  - Indicate whether the artifact is safe to process.
  - Examples: checksum mismatch, corrupted file, partial upload, missing assets.

When a real introspection artifact arrives, these signals should guide triage: fix structural/ integrity problems first, then resolve semantic questions before applying patches.

Failure Modes

The sequencer classifies runtime issues into three failure modes to drive deterministic behavior when artifacts are imperfect:

- Hard Failures (Stop Processing)
  - Conditions where the sequencer must refuse to continue and surface a human action.
  - Examples: invalid schema, corrupted artifact, missing required fields, checksum mismatch.
  - Guidance: fail fast, write an explicit error in the output artifacts, and do not emit patch SQL.

- Soft Failures (Process but Warn)
  - Conditions that allow the sequencer to continue but require human attention.
  - Examples: unknown/experimental patch type, deprecated fields, partial metadata, low confidence scores.
  - Guidance: emit warnings alongside findings, mark affected patches for manual review, continue best-effort scheduling.

- Non-Failures (Informational)
  - Signals that are noteworthy but not errors.
  - Examples: inferred relationships, optional fields missing, multi-file detection, normalization applied.
  - Guidance: include these as `info`-level signals in the output so maintainers can review and triage as needed.

These clear failure modes help automation and human reviewers respond consistently when the parser or artifact is imperfect.