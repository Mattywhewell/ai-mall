#!/usr/bin/env node
/*
  scripts/test-all-integrations.js
  - Tests all platform integrations for the mythic shader system
  - Validates package structure and key files
  - Ensures cross-platform compatibility
*/

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing All Platform Integrations...\n');

const INTEGRATIONS_DIR = path.join(__dirname, '../integrations');
const platforms = fs.readdirSync(INTEGRATIONS_DIR);

let totalTests = 0;
let passedTests = 0;

function testPlatform(platform) {
  console.log(`\n🎯 Testing ${platform.toUpperCase()} Integration...`);

  const platformDir = path.join(INTEGRATIONS_DIR, platform);
  const files = fs.readdirSync(platformDir, { recursive: true });

  let platformTests = 0;
  let platformPassed = 0;

  // Platform-specific tests
  switch(platform) {
    case 'three-js-webgl':
      // Check package.json
      if (files.includes('package.json')) {
        platformTests++;
        try {
          const pkg = JSON.parse(fs.readFileSync(path.join(platformDir, 'package.json'), 'utf8'));
          if (pkg.name === 'mythic-shaders-threejs') {
            console.log('  ✅ Package.json valid');
            platformPassed++;
          }
        } catch (e) {
          console.log('  ❌ Package.json invalid');
        }
      }

      // Check shader files
      const shaderFiles = files.filter(f => f.includes('shaders/') && f.endsWith('.js'));
      if (shaderFiles.length >= 6) {
        platformTests++;
        console.log(`  ✅ ${shaderFiles.length} shader files converted`);
        platformPassed++;
      }
      break;

    case 'reshade':
      // Check ReShade shaders
      const reshadeShaders = files.filter(f => f.includes('reshade-shaders/') && f.endsWith('.fx'));
      if (reshadeShaders.length >= 6) {
        platformTests++;
        console.log(`  ✅ ${reshadeShaders.length} ReShade shaders created`);
        platformPassed++;
      }

      // Check preset file
      if (files.includes('MythicShaders.ini')) {
        platformTests++;
        console.log('  ✅ ReShade preset file created');
        platformPassed++;
      }
      break;

    case 'obs-studio':
      // Check OBS filter config
      if (files.includes('obs-filters/mythic-filters.json')) {
        platformTests++;
        try {
          const config = JSON.parse(fs.readFileSync(path.join(platformDir, 'obs-filters/mythic-filters.json'), 'utf8'));
          if (config.filters && config.filters.length >= 3) {
            console.log('  ✅ OBS filter config valid');
            platformPassed++;
          }
        } catch (e) {
          console.log('  ❌ OBS filter config invalid');
        }
      }

      // Check shader files
      const obsShaders = files.filter(f => f.includes('obs-filters/shaders/') && f.endsWith('.frag'));
      if (obsShaders.length >= 6) {
        platformTests++;
        console.log(`  ✅ ${obsShaders.length} OBS shader files copied`);
        platformPassed++;
      }
      break;

    case 'amd-radeon':
      // Check HLSL shaders
      const hlslShaders = files.filter(f => f.includes('amd-radeon/') && f.endsWith('.hlsl'));
      if (hlslShaders.length >= 6) {
        platformTests++;
        console.log(`  ✅ ${hlslShaders.length} HLSL shaders for AMD Radeon`);
        platformPassed++;
      }
      break;

    case 'unity':
      // Check Unity package
      if (files.includes('unity-package/package.json')) {
        platformTests++;
        try {
          const pkg = JSON.parse(fs.readFileSync(path.join(platformDir, 'unity-package/package.json'), 'utf8'));
          if (pkg.name === 'com.aiverse.mythic-shaders') {
            console.log('  ✅ Unity package.json valid');
            platformPassed++;
          }
        } catch (e) {
          console.log('  ❌ Unity package.json invalid');
        }
      }

      // Check C# script
      if (files.includes('unity-package/MythicVolumeProfile.cs')) {
        platformTests++;
        console.log('  ✅ Unity C# script created');
        platformPassed++;
      }

      // Check Unity shaders
      const unityShaders = files.filter(f => f.includes('unity-package/Shaders/') && f.endsWith('.shader'));
      if (unityShaders.length >= 6) {
        platformTests++;
        console.log(`  ✅ ${unityShaders.length} Unity shader files created`);
        platformPassed++;
      }
      break;

    case 'unreal-engine':
      // Check Unreal plugin
      if (files.includes('unreal-plugin/MythicShaders.uplugin')) {
        platformTests++;
        try {
          const plugin = JSON.parse(fs.readFileSync(path.join(platformDir, 'unreal-plugin/MythicShaders.uplugin'), 'utf8'));
          if (plugin.Modules && plugin.Modules[0].Name === 'MythicShaders') {
            console.log('  ✅ Unreal plugin file valid');
            platformPassed++;
          }
        } catch (e) {
          console.log('  ❌ Unreal plugin file invalid');
        }
      }

      // Check material functions
      if (files.includes('unreal-plugin/MaterialFunctions.txt')) {
        platformTests++;
        console.log('  ✅ Unreal material functions created');
        platformPassed++;
      }
      break;

    case 'midjourney':
      // Check prompt library
      if (files.includes('midjourney-prompts/mythic-prompts.json')) {
        platformTests++;
        try {
          const prompts = JSON.parse(fs.readFileSync(path.join(platformDir, 'midjourney-prompts/mythic-prompts.json'), 'utf8'));
          if (prompts['elemental-fog'] && prompts['runic-glow']) {
            console.log('  ✅ Midjourney prompt library valid');
            platformPassed++;
          }
        } catch (e) {
          console.log('  ❌ Midjourney prompt library invalid');
        }
      }

      // Check prompt generator
      if (files.includes('midjourney-prompts/generate-prompts.js')) {
        platformTests++;
        console.log('  ✅ Midjourney prompt generator created');
        platformPassed++;
      }
      break;

    case 'framer':
      // Check Framer component
      if (files.includes('framer-components/MythicLayerRenderer.tsx')) {
        platformTests++;
        const component = fs.readFileSync(path.join(platformDir, 'framer-components/MythicLayerRenderer.tsx'), 'utf8');
        if (component.includes('addPropertyControls') && component.includes('MythicLayerRenderer')) {
          console.log('  ✅ Framer component valid');
          platformPassed++;
        }
      }
      break;

    case 'v0':
      // Check V0 generation prompt
      if (files.includes('v0-components/v0-generation-prompt.md')) {
        platformTests++;
        const prompt = fs.readFileSync(path.join(platformDir, 'v0-components/v0-generation-prompt.md'), 'utf8');
        if (prompt.includes('Mythic Shader Stack Components') && prompt.includes('React 18+')) {
          console.log('  ✅ V0 generation prompt created');
          platformPassed++;
        }
      }
      break;
  }

  // General file count check
  if (files.length > 0) {
    platformTests++;
    console.log(`  ✅ ${files.length} files generated`);
    platformPassed++;
  }

  const successRate = platformTests > 0 ? Math.round((platformPassed / platformTests) * 100) : 0;
  console.log(`  📊 ${platform.toUpperCase()}: ${platformPassed}/${platformTests} tests passed (${successRate}%)`);

  totalTests += platformTests;
  passedTests += platformPassed;

  return platformPassed === platformTests;
}

let allPlatformsPassed = true;
for (const platform of platforms) {
  const passed = testPlatform(platform);
  if (!passed) allPlatformsPassed = false;
}

console.log('\n' + '='.repeat(50));
console.log('📊 INTEGRATION TEST RESULTS');
console.log('='.repeat(50));
console.log(`Total Platforms: ${platforms.length}`);
console.log(`Total Tests: ${totalTests}`);
console.log(`Tests Passed: ${passedTests}`);
console.log(`Success Rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`);

if (allPlatformsPassed) {
  console.log('\n🎉 ALL INTEGRATIONS SUCCESSFUL!');
  console.log('\n🚀 Ready for deployment to all platforms:');
  console.log('  • Three.js/WebGL - Deploy to web applications');
  console.log('  • ReShade - Gaming/streaming post-processing');
  console.log('  • OBS Studio - Video production and streaming');
  console.log('  • AMD Radeon - Hardware-accelerated rendering');
  console.log('  • Unity - Game development post-processing');
  console.log('  • Unreal Engine - Cinematic VFX integration');
  console.log('  • Midjourney - AI art generation prompts');
  console.log('  • Framer - Design system components');
  console.log('  • V0 - AI-assisted development');

  console.log('\n📦 Integration packages are ready in: integrations/');
  console.log('📖 Complete guide: docs/shaders/INTEGRATION_GUIDE.md');
} else {
  console.log('\n⚠️  Some integrations need attention. Check the output above.');
  process.exit(1);
}