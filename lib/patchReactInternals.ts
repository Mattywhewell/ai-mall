// Runtime patch to provide React internals expected by some older packages.
// Import this as early as possible (top of `app/commons/page.tsx`) to ensure
// the patch runs before @react-three/fiber or react-reconciler are initialized.
import React from 'react';

try {
  const anyReact = React as any;
  if (typeof anyReact.ReactCurrentBatchConfig === 'undefined') {
    anyReact.ReactCurrentBatchConfig = null;
  }
  if (typeof anyReact.unstable_act === 'undefined') {
    anyReact.unstable_act = anyReact.act || function (cb: Function) { try { return cb(); } catch (e) { return undefined; } };
  }
} catch (e) {
  // Swallow - this is a best-effort runtime compatibility shim
}
export {};
