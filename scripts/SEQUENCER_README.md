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