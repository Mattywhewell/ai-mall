Title: chore: pin React to 18.2.0 and add runtime shims for react-reconciler compatibility

Summary
-------
This PR pins React and React DOM to 18.2.0 and adds a minimal, reversible runtime shim to patch React internals expected by react-reconciler/@react-three/fiber.

Why
---
- A reconciler mismatch was causing runtime errors and build/runtime warnings (e.g., `ReactCurrentBatchConfig` undefined and `unstable_act` missing).
- Downgrading to React 18.2.0 (the ecosystem anchor) and adding a short-term shim stabilizes the 3D pipeline and removes the fatal reconciler crash.

What changed
------------
- package.json: pin `react` and `react-dom` to `18.2.0` (exact), keep reconciler override at `0.29.2`.
- lib/patchReactInternals.ts: runtime patch to set `React.ReactCurrentBatchConfig = null` and provide `React.unstable_act` fallback.
- shims/react-reconciler-shim.js: wrapper that ensures the internals exist before loading production reconciler.
- Shims are isolated and reversible; import happens early in `app/commons/page.tsx`.

Verification checklist
----------------------
- [x] Production build completes
- [x] City Gate E2E test passes (no reconciler console errors)
- [x] No runtime errors in City Gate scene on load
- [ ] Run full E2E suite to confirm no regressions

Notes & follow-up
-----------------
- This is a temporary measure until upstream fixes are released.
- Follow-up PR: add a deprecation note, test that the shim becomes unnecessary, and remove it after a confirmed upstream fix.

Files of interest
-----------------
- `package.json`
- `lib/patchReactInternals.ts`
- `shims/react-reconciler-shim.js`
- `shims/react-shim.js`
- `app/commons/page.tsx` (imports the runtime patch)

Please review and I can open the PR on your behalf (or you can paste this body into the GitHub form).