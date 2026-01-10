import * as React from "react"
import { Frame, addPropertyControls, ControlType } from "framer"

// Mythic Shader Component for Framer
export function MythicLayerRenderer(props) {
  const {
    effect,
    strength,
    tint,
    depth,
    speed,
    motionReduced,
    width,
    height
  } = props

  // Simplified shader simulation for Framer
  const getShaderStyle = () => {
    switch(effect) {
      case "fog":
        return {
          background: `linear-gradient(45deg, rgba(${tint.r * 255}, ${tint.g * 255}, ${tint.b * 255}, ${strength * 0.3}), transparent)`,
          filter: `blur(${depth * 2}px)`
        }
      case "glow":
        return {
          boxShadow: `0 0 ${strength * 20}px rgba(${tint.r * 255}, ${tint.g * 255}, ${tint.b * 255}, ${strength})`,
          animation: motionReduced ? 'none' : `pulse ${2/speed}s infinite`
        }
      case "vignette":
        return {
          boxShadow: `inset 0 0 ${strength * 50}px rgba(${tint.r * 255}, ${tint.g * 255}, ${tint.b * 255}, ${strength * 0.5})`
        }
      default:
        return {}
    }
  }

  return (
    <Frame
      size={{ width, height }}
      background="transparent"
      style={getShaderStyle()}
    >
      {props.children}
    </Frame>
  )
}

MythicLayerRenderer.defaultProps = {
  effect: "fog",
  strength: 0.6,
  tint: { r: 0.8, g: 0.9, b: 1.0 },
  depth: 0.8,
  speed: 1.0,
  motionReduced: false,
  width: 400,
  height: 300
}

addPropertyControls(MythicLayerRenderer, {
  effect: {
    type: ControlType.Enum,
    options: ["fog", "glow", "vignette", "bloom"],
    defaultValue: "fog"
  },
  strength: {
    type: ControlType.Number,
    min: 0,
    max: 1,
    step: 0.1,
    defaultValue: 0.6
  },
  tint: {
    type: ControlType.Color,
    defaultValue: { r: 0.8, g: 0.9, b: 1.0 }
  },
  depth: {
    type: ControlType.Number,
    min: 0,
    max: 1,
    step: 0.1,
    defaultValue: 0.8
  },
  speed: {
    type: ControlType.Number,
    min: 0.1,
    max: 3,
    step: 0.1,
    defaultValue: 1.0
  },
  motionReduced: {
    type: ControlType.Boolean,
    defaultValue: false
  }
})

export default MythicLayerRenderer
