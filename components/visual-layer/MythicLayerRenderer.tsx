"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Shader definitions for the mythic stack
const SHADER_LIBRARY = {
  "elemental.fog.mystic": {
    name: "Mystic Fog",
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;
      uniform float u_time;
      uniform float u_strength;
      uniform vec3 u_tint;
      uniform vec2 u_resolution;
      uniform float u_depth;
      uniform bool u_motion_reduced;
      varying vec2 vUv;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float time = u_motion_reduced ? 0.0 : u_time * 0.1;
        float n1 = snoise(vec3(uv * 3.0, time));
        float n2 = snoise(vec3(uv * 6.0, time * 1.5 + 10.0));
        float n3 = snoise(vec3(uv * 12.0, time * 2.0 + 20.0));
        float fog1 = smoothstep(0.3, 0.7, n1 * u_strength);
        float fog2 = smoothstep(0.4, 0.8, n2 * u_strength * 0.7);
        float fog3 = smoothstep(0.5, 0.9, n3 * u_strength * 0.4);
        float fog = (fog1 + fog2 * 0.6 + fog3 * 0.3) * u_depth;
        float particles = smoothstep(0.85, 0.95, n1 + n2 * 0.5);
        vec3 color = mix(vec3(0.0), u_tint, fog + particles * 0.2);
        gl_FragColor = vec4(color, fog * 0.8);
      }
    `,
    blendMode: THREE.AdditiveBlending,
    defaultParams: {
      u_strength: 0.6,
      u_tint: [0.8, 0.9, 1.0],
      u_depth: 0.8,
      u_motion_reduced: false
    }
  },

  "architectural.runic-glow.medium": {
    name: "Runic Glow",
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;
      uniform float u_time;
      uniform float u_strength;
      uniform vec3 u_tint;
      uniform vec2 u_resolution;
      uniform float u_pulse_speed;
      uniform bool u_motion_reduced;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      vec2 voronoi(vec2 x) {
        vec2 n = floor(x);
        vec2 f = fract(x);
        vec2 mg, mr;
        float md = 8.0;
        for(int j = -1; j <= 1; j++) {
          for(int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = vec2(hash(n + g), hash(n + g + vec2(0.5)));
            vec2 r = g + o - f;
            float d = dot(r, r);
            if(d < md) {
              md = d;
              mr = r;
              mg = g;
            }
          }
        }
        return mr;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        vec2 st = uv * 8.0;
        vec2 gv = fract(st) - 0.5;
        vec2 id = floor(st);
        vec2 cell = voronoi(st);
        float glyph = 0.0;
        glyph += smoothstep(0.02, 0.0, abs(gv.x)) * step(0.1, hash(id));
        glyph += smoothstep(0.02, 0.0, abs(gv.y)) * step(0.3, hash(id + vec2(10.0)));
        float diag1 = smoothstep(0.03, 0.0, abs(gv.x - gv.y));
        float diag2 = smoothstep(0.03, 0.0, abs(gv.x + gv.y));
        glyph += (diag1 + diag2) * step(0.6, hash(id + vec2(20.0)));
        float circle = smoothstep(0.15, 0.13, length(gv));
        glyph += circle * step(0.8, hash(id + vec2(30.0)));
        float time = u_motion_reduced ? 0.0 : u_time * u_pulse_speed;
        float flow = sin(time + hash(id) * 6.28) * 0.5 + 0.5;
        float energy = glyph * flow * u_strength;
        float halo = smoothstep(0.1, 0.0, length(gv)) * energy * 0.3;
        vec3 color = mix(vec3(0.0), u_tint, energy + halo);
        gl_FragColor = vec4(color, energy * 0.7);
      }
    `,
    blendMode: THREE.AdditiveBlending,
    defaultParams: {
      u_strength: 0.5,
      u_tint: [1.0, 0.8, 0.4],
      u_pulse_speed: 1.0,
      u_motion_reduced: false
    }
  },

  "ritual.vignette.sacral": {
    name: "Sacral Vignette",
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;
      uniform float u_time;
      uniform float u_strength;
      uniform vec3 u_tint;
      uniform vec2 u_resolution;
      uniform float u_border_width;
      uniform bool u_motion_reduced;
      varying vec2 vUv;

      float sacredPattern(vec2 uv, float time) {
        vec2 st = uv * 2.0 - 1.0;
        float angle = atan(st.y, st.x);
        float radius = length(st);
        float star = 0.0;
        for(int i = 0; i < 8; i++) {
          float a = float(i) * 3.14159 / 4.0;
          vec2 dir = vec2(cos(a), sin(a));
          float dist = dot(st, dir);
          star += smoothstep(0.02, 0.0, abs(dist - radius * 0.7));
        }
        float circles = 0.0;
        for(int i = 1; i <= 3; i++) {
          float r = float(i) * 0.2;
          circles += smoothstep(0.01, 0.0, abs(radius - r));
        }
        float flow = sin(time + radius * 8.0) * 0.5 + 0.5;
        return (star + circles) * flow;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(uv, center);
        float vignette1 = smoothstep(0.3, 0.8, dist);
        float vignette2 = smoothstep(0.2, 0.7, dist);
        float vignette3 = smoothstep(0.1, 0.6, dist);
        float vignette = (vignette1 + vignette2 * 0.5 + vignette3 * 0.25) * u_strength;
        float time = u_motion_reduced ? 0.0 : u_time;
        float sacred = sacredPattern(uv, time);
        float border = smoothstep(u_border_width, u_border_width + 0.1, dist);
        float energy = sacred * border * u_strength;
        vec3 vignetteColor = mix(vec3(0.0), u_tint * 0.3, vignette);
        vec3 energyColor = mix(vec3(0.0), u_tint, energy);
        vec3 finalColor = vignetteColor + energyColor;
        gl_FragColor = vec4(finalColor, vignette + energy * 0.8);
      }
    `,
    blendMode: THREE.NormalBlending,
    defaultParams: {
      u_strength: 0.4,
      u_tint: [0.9, 0.6, 0.8],
      u_border_width: 0.4,
      u_motion_reduced: false
    }
  }
};

interface LayerConfig {
  slug: string;
  enabled: boolean;
  strength: number;
  params?: Record<string, any>;
}

interface MythicLayerRendererProps {
  layers: LayerConfig[];
  motionReduced?: boolean;
}

const LayerMaterial: React.FC<{
  layer: LayerConfig;
  motionReduced: boolean;
}> = ({ layer, motionReduced }) => {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const shader = SHADER_LIBRARY[layer.slug];

  useFrame(({ clock }) => {
    if (!materialRef.current || !shader) return;
    materialRef.current.uniforms.u_time.value = clock.getElapsedTime();
    materialRef.current.uniforms.u_motion_reduced.value = motionReduced;
  });

  if (!shader) return null;

  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(800, 600) },
    u_motion_reduced: { value: motionReduced },
    ...shader.defaultParams,
    ...layer.params,
    u_strength: { value: layer.strength }
  }), [layer, motionReduced, shader]);

  return (
    <shaderMaterial
      ref={materialRef}
      transparent
      depthWrite={false}
      blending={shader.blendMode}
      uniforms={uniforms}
      vertexShader={shader.vertexShader}
      fragmentShader={shader.fragmentShader}
    />
  );
};

export default function MythicLayerRenderer({
  layers,
  motionReduced = false
}: MythicLayerRendererProps) {
  const [hasWebGL, setHasWebGL] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl'));
      setHasWebGL(!!gl);
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  if (hasWebGL === false) {
    return (
      <div style={{ width: '100%', height: '500px', borderRadius: 12, overflow: 'hidden', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#fff', textAlign: 'center' }}>
          <div>WebGL not available</div>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>Mythic layering requires WebGL support</div>
        </div>
      </div>
    );
  }

  if (hasWebGL === null) {
    return (
      <div style={{ width: '100%', height: '500px', borderRadius: 12, overflow: 'hidden', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#fff' }}>Initializing mythic renderer…</div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "500px", borderRadius: 12, overflow: "hidden", background: "#111" }}>
      <Canvas camera={{ position: [0, 1.5, 3], fov: 55 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 7]} intensity={1.0} />

        {/* Base scene */}
        <mesh position={[0, 0.6, 0]} rotation={[0.4, 0.6, 0]}>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial color="#8B5CF6" metalness={0.4} roughness={0.2} />
        </mesh>

        <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#111" metalness={0.0} roughness={1} />
        </mesh>

        {/* Layer overlays */}
        {layers.filter(layer => layer.enabled).map((layer, index) => (
          <mesh key={layer.slug} position={[0, 0, 1 + index * 0.1]} scale={[4, 2.5, 1]}>
            <planeGeometry args={[1, 1]} />
            <LayerMaterial layer={layer} motionReduced={motionReduced} />
          </mesh>
        ))}

        <OrbitControls enablePan={false} minDistance={2} maxDistance={10} />
      </Canvas>
    </div>
  );
}