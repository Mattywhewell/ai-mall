
const { MythicShaderStack } = require('./MythicShaderStack');

module.exports = {
  MythicShaderStack,
  // Export individual shaders
  shaders: {
    mysticFog: require('./shaders/elemental.fog.mystic'),
    volumetricFog: require('./shaders/elemental.fog.volumetric'),
    cinematicBloom: require('./shaders/elemental.bloom.cinematic'),
    runicGlow: require('./shaders/architectural.runic-glow.medium'),
    sacralVignette: require('./shaders/ritual.vignette.sacral'),
    melancholyGrade: require('./shaders/emotional.color-grade.melancholy')
  }
};
