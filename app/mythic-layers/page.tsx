"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import the 3D renderer to prevent SSR issues
const MythicLayerRenderer = dynamic(() => import("@/components/visual-layer/MythicLayerRenderer"), { ssr: false });

interface LayerConfig {
  slug: string;
  enabled: boolean;
  strength: number;
  params?: Record<string, any>;
}

const MYTHIC_PRESETS = {
  "Observatory of Becoming": {
    name: "Observatory of Becoming",
    description: "Mystic fog with runic architectural elements",
    layers: [
      { slug: "elemental.fog.mystic", enabled: true, strength: 0.7, params: { u_tint: [0.8, 0.9, 1.0], u_depth: 0.8 } },
      { slug: "architectural.runic-glow.medium", enabled: true, strength: 0.5, params: { u_tint: [1.0, 0.8, 0.4] } }
    ]
  },
  "Sacred Ritual Chamber": {
    name: "Sacred Ritual Chamber",
    description: "Ritual vignette with mystical energy",
    layers: [
      { slug: "ritual.vignette.sacral", enabled: true, strength: 0.6, params: { u_tint: [0.9, 0.6, 0.8] } },
      { slug: "elemental.fog.mystic", enabled: true, strength: 0.4, params: { u_tint: [0.7, 0.8, 1.0], u_depth: 0.6 } }
    ]
  },
  "Elemental Nexus": {
    name: "Elemental Nexus",
    description: "Full mythic stack with all elemental forces",
    layers: [
      { slug: "elemental.fog.mystic", enabled: true, strength: 0.8, params: { u_tint: [0.6, 0.8, 1.0], u_depth: 1.0 } },
      { slug: "architectural.runic-glow.medium", enabled: true, strength: 0.6, params: { u_tint: [1.0, 0.7, 0.3] } },
      { slug: "ritual.vignette.sacral", enabled: true, strength: 0.4, params: { u_tint: [0.8, 0.5, 0.9] } }
    ]
  }
};

export default function MythicLayersDemoPage() {
  const [selectedPreset, setSelectedPreset] = useState<string>("Observatory of Becoming");
  const [customLayers, setCustomLayers] = useState<LayerConfig[]>([
    { slug: "elemental.fog.mystic", enabled: true, strength: 0.6, params: { u_tint: [0.8, 0.9, 1.0] } },
    { slug: "architectural.runic-glow.medium", enabled: false, strength: 0.5, params: { u_tint: [1.0, 0.8, 0.4] } },
    { slug: "ritual.vignette.sacral", enabled: false, strength: 0.4, params: { u_tint: [0.9, 0.6, 0.8] } }
  ]);

  const currentLayers = selectedPreset === "Custom"
    ? customLayers
    : MYTHIC_PRESETS[selectedPreset as keyof typeof MYTHIC_PRESETS]?.layers || [];

  const updateLayer = (index: number, updates: Partial<LayerConfig>) => {
    const newLayers = [...customLayers];
    newLayers[index] = { ...newLayers[index], ...updates };
    setCustomLayers(newLayers);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
          Mythic Shader Layers — Aiverse Integration
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Advanced visual layering system inspired by ReShade, OBS, and Unity/Unreal post-processing.
          Experience elemental, architectural, ritualistic, and emotional shader effects.
        </p>

        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
          <h2 className="text-xl font-semibold mb-3 text-indigo-900">🎨 Integration Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="font-medium text-green-700">✅ ReShade-style Injection</div>
              <div className="text-gray-600">Real-time post-processing layers</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="font-medium text-green-700">✅ OBS Shader Filters</div>
              <div className="text-gray-600">GLSL shaders with blend modes</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="font-medium text-green-700">✅ Radeon Visual Filters</div>
              <div className="text-gray-600">Hardware-accelerated effects</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="font-medium text-green-700">✅ Unity/Unreal Stacks</div>
              <div className="text-gray-600">Cinematic VFX pipelines</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Renderer */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
            <MythicLayerRenderer layers={currentLayers} />
          </div>

          <div className="mt-6 bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4">🎭 Mythic Layer Stack</h3>
            <div className="space-y-3">
              {currentLayers.map((layer, index) => (
                <div key={layer.slug} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${layer.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="font-medium">{layer.slug.split('.').slice(1).join(' ')}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Strength: {(layer.strength * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          {/* Preset Selector */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4">🏛️ Mythic Presets</h3>
            <div className="space-y-3">
              {Object.entries(MYTHIC_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPreset(key)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedPreset === key
                      ? 'bg-indigo-100 border-2 border-indigo-300'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">{preset.name}</div>
                  <div className="text-sm text-gray-600">{preset.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {preset.layers.length} layers active
                  </div>
                </button>
              ))}
              <button
                onClick={() => setSelectedPreset("Custom")}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedPreset === "Custom"
                    ? 'bg-purple-100 border-2 border-purple-300'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">🎨 Custom Configuration</div>
                <div className="text-sm text-gray-600">Build your own mythic stack</div>
              </button>
            </div>
          </div>

          {/* Custom Controls */}
          {selectedPreset === "Custom" && (
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4">⚙️ Layer Controls</h3>
              <div className="space-y-4">
                {customLayers.map((layer, index) => (
                  <div key={layer.slug} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-sm">
                        {layer.slug.split('.').slice(1).join(' ')}
                      </span>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={layer.enabled}
                          onChange={(e) => updateLayer(index, { enabled: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm">Enabled</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Strength: {(layer.strength * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={layer.strength}
                        onChange={(e) => updateLayer(index, { strength: parseFloat(e.target.value) })}
                        className="w-full"
                        disabled={!layer.enabled}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integration Info */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
            <h3 className="text-lg font-semibold mb-3 text-purple-900">🔗 Integration Ready</h3>
            <div className="space-y-2 text-sm text-purple-800">
              <div>🎯 <strong>Midjourney/Framer/V0:</strong> Prompts include layer tokens</div>
              <div>🎨 <strong>Shader Taxonomy:</strong> Lore-aligned naming system</div>
              <div>🌊 <strong>Elemental Effects:</strong> Fog, bloom, energy flows</div>
              <div>🏛️ <strong>Architectural:</strong> Runic glows, mystical structures</div>
              <div>🕯️ <strong>Ritual:</strong> Sacred vignettes, energy seals</div>
              <div>💭 <strong>Emotional:</strong> Color grading, mood enhancement</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}