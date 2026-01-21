"use client";

import React from "react";
import { reportRendererImportFailure } from "@/lib/telemetry/reportRendererImportFailure";

// Exported helper so tests can stub or override the dynamic loader behavior
export async function loadThreeRenderer() {
  const mod = await import("./ThreeRenderer");
  return mod.default;
}

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

  // If WebGL is available, attempt to dynamically import the heavier renderer module on the client.
  React.useEffect(() => {
    if (hasWebGL) {
      (async () => {
        try {
          // Test hook: allow tests to force an import failure via URL param or global flag to simulate runtime dynamic import errors
          try {
            // @ts-ignore - test hook
            if ((window as any).__FORCE_IMPORT_FAIL) {
               
              console.log('[TEST HOOK] FORCED IMPORT FAIL DETECTED');
              throw new Error('forced import failure (test)');
            }
            const params = new URLSearchParams(window.location.search);
            if (params.get('forceImportFail') === 'true') {
               
              console.log('[TEST HOOK] FORCED IMPORT FAIL DETECTED (via URL)');
              throw new Error('forced import failure (test)');
            }
          } catch (e) {}

          const Comp = await loadThreeRenderer();
          setRendererComponent(() => Comp ?? null);
        } catch (err) {
          // Report import failure for telemetry without affecting UX besides falling back
          try {
            await reportRendererImportFailure(String((err as any)?.message || err), { stack: (err as any)?.stack });
          } catch (e) {
            // swallow telemetry errors
          }
           
          console.error('Failed to load ThreeRenderer, falling back to built-in renderer:', err);
           
          console.log('[TEST HOOK] setHasWebGL(false) about to be called');
          setHasWebGL(false);
           
          console.log('[TEST HOOK] setHasWebGL(false) called');
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

  // If we successfully loaded the separate `ThreeRenderer` component, prefer that (it isolates three.js
  // and react-three/fiber into a client-only chunk). If WebGL is available but the dynamic module is still
  // loading, render a lightweight client-only loading placeholder. If WebGL is unavailable we fall back to
  // the static preview above.
  if (RendererComponent) {
    const Loaded = RendererComponent as React.ComponentType<any>;
    return <Loaded strength={strength} tint={tint} />;
  }

  if (hasWebGL) {
    // WebGL is available but the heavy renderer hasn't loaded yet — show a minimal placeholder to avoid
    // importing three.js into this module during evaluation.
    return (
      <div style={{ width: '100%', height: '500px', borderRadius: 12, overflow: 'hidden', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#fff' }}>Loading 3D renderer…</div>
      </div>
    );
  }

  // Should never reach here because `hasWebGL === false` is handled above, but keep a safe fallback.
  return (
    <div style={{ width: '100%', height: '500px', borderRadius: 12, overflow: 'hidden', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src="/shader-previews/runic-medium.svg" alt="Runic glow preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}
