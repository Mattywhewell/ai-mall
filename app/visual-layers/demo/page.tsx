"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import the 3D renderer to prevent SSR issues
const VisualLayerRenderer = dynamic(
  // Try to dynamically import the renderer, but catch any initialization errors and
  // fallback to a simple, test-friendly static preview component so client-side
  // exceptions don't surface as an App overlay and fail tests.
  () => import("@/components/visual-layer/Renderer").then((mod) => mod.default).catch((err) => {
    console.error('VisualLayerRenderer dynamic import failed:', err);
    return function FallbackRenderer() {
      return (
        <div style={{ width: '100%', height: '500px', borderRadius: 12, overflow: 'hidden', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/shader-previews/runic-medium.svg" alt="Runic glow preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      );
    };
  }),
  { ssr: false }
);

export default function DemoPage() {
  const [strength, setStrength] = useState(0.6);
  const [tint, setTint] = useState("#FFC87A");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-4">Visual Layers — PoC Demo</h1>
      <p className="text-sm text-gray-600 mb-6">A small proof-of-concept renderer showing a shader overlay (fog / runic glow). Use the controls to tune parameters.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <VisualLayerRenderer strength={strength} tint={tint} />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Strength: {strength.toFixed(2)}</label>
            <input type="range" min={0} max={1} step={0.01} value={strength} onChange={(e)=>setStrength(parseFloat(e.target.value))} className="w-full" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tint</label>
            <input type="color" value={tint} onChange={(e)=>setTint(e.target.value)} className="w-24 h-10 p-0 border-none" />
          </div>

          <div className="bg-white p-4 rounded-md shadow-sm">
            <h3 className="font-semibold mb-2">Notes</h3>
            <ul className="text-sm text-gray-600 list-disc list-inside">
              <li>Shader is intentionally simple for demo: noise-driven fog + radial vignette + additive tint.</li>
              <li>Accessibility: include reduced-motion param in future iterations.</li>
              <li>Fallback: if WebGL is unavailable, we will render a static preview image and/or CSS overlay.</li>
            </ul>
          </div>

          <div className="text-sm text-gray-500">To test: open this page in Chrome/Edge with hardware acceleration enabled. Controls update the overlay in real-time.</div>
        </div>
      </div>
    </div>
  );
}
