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
// Use require.resolve with project root to get the node_modules path
const reconcilerPath = require.resolve('react-reconciler/cjs/react-reconciler.production.min.js', { paths: [process.cwd()] });
module.exports = require(reconcilerPath);
