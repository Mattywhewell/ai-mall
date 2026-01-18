# Testing notes

This document captures test hooks and tips useful for reproducing or triaging E2E failures.

## Visual Layers test hooks
- Force no WebGL: In Playwright tests, you can use the init script hook to make `HTMLCanvasElement.prototype.getContext` return `null` and set `window.__FORCE_NO_WEBGL = true`. Example included in `tests/e2e/visual-layers-fallback.spec.ts`.

- Force import failure: Use the URL param `?forceImportFail=true` when navigating to `/visual-layers/demo` to simulate a dynamic import failure of the heavy renderer. This causes the renderer to fall back to the static preview and triggers a telemetry POST (`/api/telemetry/hero-event`) for triage.

## Telemetry
- The import failure telemetry event is named `renderer-import-failure` and is posted to `/api/telemetry/hero-event` with a small payload; use Playwright route interception to validate and capture events in tests.

## Notes
- Keep tests focused and small: prefer targeted E2E tests for stability checks and unit tests for functional/edge behavior.
