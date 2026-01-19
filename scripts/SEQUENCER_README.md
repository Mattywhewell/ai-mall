Sequencer runner — one-line summary

A small Python reference sequencer that turns normalized parser output (the "findings JSON") into an ordered, phased patch plan suitable for human review and execution. It produces a deterministic patch ordering and phase plan for Additive → Corrective → Destructive classifications. See `scripts/sequencer_runner.py` for the runnable example and `scripts/tests` for tests.

Note: future multi-file introspection support (e.g., schema/tables/indexes bundles) will be integrated into `parse_json_findings` and cross-file dependency resolution — see `docs/FUTURE_EXTENSION_PATH.md` for the roadmap.