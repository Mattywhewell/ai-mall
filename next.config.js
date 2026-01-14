/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingRoot: process.cwd(),
  // Enable production browser source maps for actionable source-mapped stack traces
  productionBrowserSourceMaps: true,
  // experimental optimizations: test enabling optimizePackageImports for suspect packages
  // (was enabled previously; keep disabled while we reproduce and debug)
  // experimental optimizations: optimizePackageImports causes startup failures
  // (disabled to prevent server startup issues)
  // experimental: {
  //   optimizePackageImports: ['@react-three/fiber', '@react-three/drei', 'framer-motion'],
  // },
  webpack: (config, { isServer, dev }) => {
    // Add alias for react-reconciler/constants to fix @react-three/fiber compatibility
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-reconciler/constants': require.resolve('./shims/react-reconciler-constants.js'),
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      // For client builds, avoid aliasing 'react-reconciler' to the shim to prevent
      // client-side runtime import loops; keep only constants shim for compatibility.
    } else {
      // For server builds, patch react-reconciler so server-side code uses the shimmed module
      config.resolve.alias = {
        ...config.resolve.alias,
        'react-reconciler': require.resolve('./shims/react-reconciler-shim.js'),
      };
    }
    return config;
  },
};

module.exports = nextConfig;
