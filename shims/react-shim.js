// React shim that re-exports the real React and provides a named unstable_act export
// Uses require.resolve to avoid webpack alias circular resolution
const realReactPath = require.resolve('react', { paths: [process.cwd()] });
const RealReact = require(realReactPath);

// Provide a safe unstable_act named export
const unstable_act = RealReact.unstable_act || RealReact.act || function (cb) {
  try {
    return cb();
  } catch (e) {
    return undefined;
  }
};

// Re-export everything
module.exports = {
  ...RealReact,
  unstable_act,
  default: RealReact,
};
