#!/usr/bin/env node
/*
  scripts/create-integration-example.js
  - Creates a simple integration example for the mythic shader system
  - Demonstrates how to use the shaders in a web application
*/

const fs = require('fs');
const path = require('path');

console.log('🔧 Creating Mythic Shader Integration Example...\n');

// Create a simple web page that demonstrates the shader system
const exampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mythic Shader Integration Example</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <style>
        body {
            margin: 0;
            background: #000;
            font-family: Arial, sans-serif;
            color: white;
        }
        #container {
            width: 100vw;
            height: 100vh;
        }
        #controls {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0,0,0,0.8);
            padding: 20px;
            border-radius: 10px;
            z-index: 100;
        }
        .control-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-size: 12px;
        }
        input[type="range"] {
            width: 200px;
        }
        .preset-btn {
            background: #4A90E2;
            border: none;
            color: white;
            padding: 8px 16px;
            margin: 5px;
            border-radius: 5px;
            cursor: pointer;
        }
        .preset-btn:hover {
            background: #357ABD;
        }
    </style>
</head>
<body>
    <div id="controls">
        <h3>🎨 Mythic Shader Demo</h3>

        <div class="control-group">
            <button class="preset-btn" onclick="loadPreset('Observatory')">Observatory</button>
            <button class="preset-btn" onclick="loadPreset('Ritual')">Ritual Chamber</button>
            <button class="preset-btn" onclick="loadPreset('Elemental')">Elemental Nexus</button>
        </div>

        <div class="control-group">
            <label>Mystic Fog Strength: <span id="fog-strength">0.6</span></label>
            <input type="range" id="fog-slider" min="0" max="1" step="0.1" value="0.6" oninput="updateFog(this.value)">
        </div>

        <div class="control-group">
            <label>Runic Glow Strength: <span id="runic-strength">0.5</span></label>
            <input type="range" id="runic-slider" min="0" max="1" step="0.1" value="0.5" oninput="updateRunic(this.value)">
        </div>

        <div class="control-group">
            <label>Ritual Vignette Strength: <span id="ritual-strength">0.4</span></label>
            <input type="range" id="ritual-slider" min="0" max="1" step="0.1" value="0.4" oninput="updateRitual(this.value)">
        </div>
    </div>

    <div id="container"></div>

    <script>
        // Three.js scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('container').appendChild(renderer.domElement);

        // Create a simple plane to display shaders
        const geometry = new THREE.PlaneGeometry(16, 9);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0 },
                u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                u_strength: { value: 0.6 },
                u_tint: { value: new THREE.Vector3(0.8, 0.9, 1.0) },
                u_depth: { value: 0.8 },
                u_motion_reduced: { value: false }
            },
            vertexShader: \`
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            \`,
            fragmentShader: \`
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

                    vec3 n_ = 0.142857142857 * floor(p * (1.0 / 7.0));
                    vec4 ns = p - 7.0 * floor(p * (1.0 / 7.0)) - 0.285714285714 * 7.0;
                    vec4 j = p - 49.0 * floor(p * (1.0 / 49.0)) + 0.285714285714 * 49.0;
                    vec4 x_ = floor(j * (1.0 / 7.0));
                    vec4 y_ = floor(j - 7.0 * x_);
                    vec4 x = x_ * (1.0 / 7.0) + 0.428571428571 * (1.0 / 7.0);
                    vec4 y = y_ * (1.0 / 7.0) + 0.428571428571 * (1.0 / 7.0);
                    vec4 h = 1.0 - abs(x) - abs(y);
                    vec4 b0 = vec4(x.xy, y.xy);
                    vec4 b1 = vec4(x.zw, y.zw);
                    vec4 s0 = floor(b0) * 2.0 + 1.0;
                    vec4 s1 = floor(b1) * 2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
                    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
                    vec3 p0 = vec3(a0.xy, h.x);
                    vec3 p1 = vec3(a0.zw, h.y);
                    vec3 p2 = vec3(a1.xy, h.z);
                    vec3 p3 = vec3(a1.zw, h.w);
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
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
            \`,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        const plane = new THREE.Mesh(geometry, material);
        scene.add(plane);

        camera.position.z = 5;

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            material.uniforms.u_time.value += 0.01;
            renderer.render(scene, camera);
        }
        animate();

        // Control functions
        function updateFog(value) {
            material.uniforms.u_strength.value = parseFloat(value);
            document.getElementById('fog-strength').textContent = value;
        }

        function updateRunic(value) {
            // For demo, we'll just adjust the tint
            const tint = material.uniforms.u_tint.value;
            tint.x = 0.4 + parseFloat(value) * 0.6; // Blue to cyan
            material.uniforms.u_tint.value = tint;
            document.getElementById('runic-strength').textContent = value;
        }

        function updateRitual(value) {
            material.uniforms.u_depth.value = parseFloat(value);
            document.getElementById('ritual-strength').textContent = value;
        }

        function loadPreset(preset) {
            switch(preset) {
                case 'Observatory':
                    updateFog(0.7);
                    document.getElementById('fog-slider').value = 0.7;
                    updateRunic(0.5);
                    document.getElementById('runic-slider').value = 0.5;
                    updateRitual(0.8);
                    document.getElementById('ritual-slider').value = 0.8;
                    material.uniforms.u_tint.value.set(0.8, 0.9, 1.0);
                    break;
                case 'Ritual':
                    updateFog(0.4);
                    document.getElementById('fog-slider').value = 0.4;
                    updateRunic(0.3);
                    document.getElementById('runic-slider').value = 0.3;
                    updateRitual(0.6);
                    document.getElementById('ritual-slider').value = 0.6;
                    material.uniforms.u_tint.value.set(0.9, 0.6, 0.8);
                    break;
                case 'Elemental':
                    updateFog(0.8);
                    document.getElementById('fog-slider').value = 0.8;
                    updateRunic(0.6);
                    document.getElementById('runic-slider').value = 0.6;
                    updateRitual(1.0);
                    document.getElementById('ritual-slider').value = 1.0;
                    material.uniforms.u_tint.value.set(0.6, 0.8, 1.0);
                    break;
            }
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            material.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
        });
    </script>
</body>
</html>`;

const examplePath = path.join(__dirname, '../public/mythic-shader-demo.html');
fs.writeFileSync(examplePath, exampleHtml);

console.log('✅ Created integration example: public/mythic-shader-demo.html');
console.log('\n🚀 To test the integration:');
console.log('  1. Visit: http://localhost:3000/mythic-shader-demo.html');
console.log('  2. Use the controls to adjust shader parameters');
console.log('  3. Try different presets (Observatory, Ritual Chamber, Elemental Nexus)');
console.log('\n📖 This demonstrates:');
console.log('  • Three.js shader integration');
console.log('  • Real-time parameter control');
console.log('  • Preset system');
console.log('  • WebGL rendering');
console.log('\n🔧 Next steps:');
console.log('  • Integrate with your main application');
console.log('  • Add more shader layers');
console.log('  • Deploy to production');
console.log('  • Check docs/shaders/INTEGRATION_GUIDE.md for other platforms');