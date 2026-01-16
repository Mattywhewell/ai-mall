"use client";

import React, { Suspense } from "react";

const ThreeRenderer = React.lazy(() => import("./ThreeRenderer"));

type VisualLayerRendererProps = {
  strength?: number; // 0..1
  tint?: string; // hex color
};

export default function VisualLayerRenderer({ strength = 0.6, tint = "#FFC87A" }: VisualLayerRendererProps) {
  const [hasWebGL, setHasWebGL] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    try {
      // Test hook: allow tests to force no-WebGL detection via a global flag or URL param
      try {
        // @ts-ignore - test hook
        if ((window as any).__FORCE_NO_WEBGL) {
          setHasWebGL(false);
          return;
        }
      } catch (e) {}

      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('forceNoWebGL') === 'true') {
          setHasWebGL(false);
          return;
        }
      } catch (e) {}

      const canvas = document.createElement('canvas');
      const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl'));
      setHasWebGL(!!gl);
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  if (hasWebGL === false) {
    // Fallback static preview when WebGL is unavailable
    return (
      <div style={{ width: '100%', height: '500px', borderRadius: 12, overflow: 'hidden', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/shader-previews/runic-medium.svg" alt="Runic glow preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }

  // If still checking, show a small loader placeholder to avoid layout shift
  if (hasWebGL === null) {
    return (
      <div style={{ width: '100%', height: '500px', borderRadius: 12, overflow: 'hidden', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#fff' }}>Checking renderer…</div>
      </div>
    );
  }

  // Lazy-load the heavy 3D renderer to avoid importing three.js/react-three during module evaluation which
  // can fail in test/SSR environments. If the lazy import fails, Suspense will fallback to null and
  // the outer dynamic import in the page will also handle the failure.
  return (
    <div style={{ width: "100%", height: "500px", borderRadius: 12, overflow: "hidden", background: "#111" }}>
      <Suspense fallback={<div style={{ color: '#fff' }}>Loading renderer…</div>}>
        <ThreeRenderer strength={strength} tint={tint} />
      </Suspense>
    </div>
  );
}
