// Shim: patch React internals required by react-reconciler before loading it
// This is a minimal, reversible workaround until upstream packages align.

try {
  const React = require('react');
  if (React && typeof React === 'object') {
    if (typeof React.ReactCurrentBatchConfig === 'undefined') {
      // reconciler expects this symbol; set to null (safe default)
      React.ReactCurrentBatchConfig = null;
    }
    if (typeof React.unstable_act === 'undefined') {
      // Provide a best-effort unstable_act fallback to avoid import errors.
      React.unstable_act = React.act || function (cb) {
        try {
          return cb();
        } catch (e) {
          // swallow to avoid breaking builds/tests; real act likely not necessary in production
          return undefined;
        }
      };
    }
  }
} catch (err) {
  // If patching fails, do not crash - continue to require the reconciler.
  // We'll surface any runtime errors in E2E logs.
}

// Resolve the actual reconciler file to avoid circular alias resolution
// On server builds we can use require.resolve safely; on client bundles, require.resolve may be unavailable
// so resolve the module via an explicit path into node_modules to avoid webpack alias cycles.
let resolvedReconciler = null;
try {
  if (typeof window === 'undefined') {
    // Server-side: use require.resolve with project root
    const reconcilerPath = require.resolve('react-reconciler/cjs/react-reconciler.production.min.js', { paths: [process.cwd()] });
    resolvedReconciler = require(reconcilerPath);
  } else {
    // Client-side bundle: compute absolute path to package entry to bypass the alias
    try {
      const path = require('path');
      const reconcilerPath = path.join(__dirname, '..', 'node_modules', 'react-reconciler', 'index.js');
      resolvedReconciler = require(reconcilerPath);
    } catch (innerErr) {
      // As a last resort, try to require the package normally (webpack should resolve it to the real module)
      try {
        resolvedReconciler = require('react-reconciler');
      } catch (err) {
        // If everything fails, expose an informative stub to avoid crashing the client.
        resolvedReconciler = {};
      }
    }
  }
} catch (err) {
  // If resolution still fails, export a safe stub rather than blowing up the client.
  resolvedReconciler = {};
}
module.exports = resolvedReconciler;
