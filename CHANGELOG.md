# Changelog

## Unreleased

### Fixed
- Visual Layers: lazy-load the 3D renderer to avoid module-evaluation/runtime errors in test and SSR environments. Added a graceful fallback to a static preview when the renderer can't be loaded. (PR #16)

### Added
- Tests: import-failure E2E for Visual Layers to ensure fallback + telemetry are triggered when dynamic import fails.
- Testing docs: documented test hooks for forcing WebGL absence and simulated import failure.
- Mobility: formalize onboarding rejection as a first-class governance primitive — introduces a canonical `onboarding_reject` NDJSON schema (fields: `ts`, `action`, `device_id`, `request_file`, `reason_code`, `reason_detail`, `evidence`, `severity`, `actor`, `workflow_run`, `trace_id`), enforces `severity` domain (`high|medium|low`), adds a fast PR-level schema validator (`scripts/tpm/assert_rejections_schema.sh`) and a unit negative-flow test, and wires CI and swtpm E2E to emit and upload `tmp/lineage/rejections_*.ndjson` for auditability (PR #118).
