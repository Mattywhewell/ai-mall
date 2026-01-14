/* Safe reconciler shim
   - Only patch React internals on server-side to avoid client bundling/runtime issues
   - Export a minimal safe stub on the client (no dynamic requires)
*/

let exported = {};
try {
  if (typeof window === 'undefined') {
    // Server-side: attempt to patch React internals (safe to require React here)
    try {
      const React = require('react');
      if (React && typeof React === 'object') {
        if (typeof React.ReactCurrentBatchConfig === 'undefined') {
          React.ReactCurrentBatchConfig = null;
        }
        if (typeof React.unstable_act === 'undefined') {
          React.unstable_act = React.act || function (cb) { try { return cb(); } catch (e) { return undefined; } };
        }
      }
    } catch (e) {
      // ignore patch failures on server
    }

    // Prefer the production reconciler bundle if available.
    // Use indirect require via eval to avoid static analysis by the bundler generating module-not-found warnings.
    const safeRequire = (name) => {
      try {
        return eval('require')(name);
      } catch (err) {
        return null;
      }
    };

    exported = safeRequire('react-reconciler/cjs/react-reconciler.production.min.js') || safeRequire('react-reconciler') || {};
  } else {
    // Client-side: avoid dynamic requires and side-effects during bundling
    // Export a harmless stub object so imports succeed without triggering the above warnings
    exported = {};
  }
} catch (err) {
  exported = {};
}

module.exports = exported; 
