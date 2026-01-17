# Changelog

## Unreleased

### Fixed
- Visual Layers: lazy-load the 3D renderer to avoid module-evaluation/runtime errors in test and SSR environments. Added a graceful fallback to a static preview when the renderer can't be loaded. (PR #16)

### Added
- Tests: import-failure E2E for Visual Layers to ensure fallback + telemetry are triggered when dynamic import fails.
- Testing docs: documented test hooks for forcing WebGL absence and simulated import failure.
