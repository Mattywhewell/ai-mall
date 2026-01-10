#!/usr/bin/env node
const prompts = require('./mythic-prompts.json');

function generatePrompt(effect, variation = 0) {
  const effectData = prompts[effect];
  if (!effectData) return 'Effect not found';

  const basePrompt = effectData.base;
  const variationText = effectData.variations[variation] || effectData.variations[0];
  const parameters = effectData.parameters;

  return `${basePrompt}, ${variationText} ${parameters}`;
}

// Example usage
console.log('Midjourney Prompt Examples:');
console.log('Fog Effect:', generatePrompt('elemental-fog'));
console.log('Runic Glow:', generatePrompt('runic-glow'));
console.log('Sacral Vignette:', generatePrompt('sacral-vignette'));
console.log('Melancholy Grade:', generatePrompt('melancholy-grade'));
