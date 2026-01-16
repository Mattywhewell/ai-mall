"use client";

import React, { Suspense } from "react";

type VisualLayerRendererProps = {
  strength?: number; // 0..1
  tint?: string; // hex color
};

export default function VisualLayerRenderer({ strength = 0.6, tint = "#FFC87A" }: VisualLayerRendererProps) {
  const [hasWebGL, setHasWebGL] = React.useState<boolean | null>(null);
  const [RendererComponent, setRendererComponent] = React.useState<React.ComponentType<any> | null>(null);

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

  // If WebGL is available, attempt to dynamically import the heavy renderer only on the client.
  // If the import fails (e.g., due to runtime errors in bundled three.js/react-three code),
  // fall back to the static preview so tests and CI remain stable.
  React.useEffect(() => {
    if (hasWebGL) {
      (async () => {
        try {
          const mod = await import("./ThreeRenderer");
          setRendererComponent(() => mod.default);
        } catch (err) {
          // Import failed; disable WebGL rendering and fall back to static preview
          // eslint-disable-next-line no-console
          console.error('Failed to load ThreeRenderer, falling back to static preview:', err);
          setHasWebGL(false);
        }
      })();
    }
  }, [hasWebGL]);

  if (hasWebGL === false) {
    // Fallback static preview when WebGL is unavailable
    return (
      <div style={{ width: '100%', height: '500px', borderRadius: 12, overflow: 'hidden', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/shader-previews/runic-medium.svg" alt="Runic glow preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }

  // If still checking, show a small loader placeholder to avoid layout shift
  if (hasWebGL === null || (hasWebGL && RendererComponent === null)) {
    return (
      <div style={{ width: '100%', height: '500px', borderRadius: 12, overflow: 'hidden', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#fff' }}>{RendererComponent ? 'Loading renderer…' : 'Checking renderer…'}</div>
      </div>
    );
  }

  // If we have a client-side renderer component loaded, render it. Otherwise, the fallback preview will be shown.
  const Loaded = RendererComponent as React.ComponentType<any>;
  return (
    <div style={{ width: "100%", height: "500px", borderRadius: 12, overflow: "hidden", background: "#111" }}>
      {Loaded ? <Loaded strength={strength} tint={tint} /> : null}
    </div>
  );
}
