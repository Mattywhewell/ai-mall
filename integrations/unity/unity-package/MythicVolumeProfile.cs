using UnityEngine;
using UnityEngine.Rendering.PostProcessing;

[CreateAssetMenu(menuName = "PostProcessing/MythicVolumeProfile")]
public class MythicVolumeProfile : PostProcessVolume
{
    [Header("Elemental Effects")]
    public MythicFog fogLayer;
    public MythicBloom bloomLayer;

    [Header("Architectural Effects")]
    public RunicGlow glowLayer;

    [Header("Ritual Effects")]
    public SacralVignette vignetteLayer;

    [Header("Emotional Effects")]
    public MelancholyGrade colorGradeLayer;
}

[System.Serializable]
public class MythicFog : PostProcessEffectSettings
{
    [Range(0f, 1f)] public FloatParameter strength = new FloatParameter { value = 0.6f };
    public ColorParameter tint = new ColorParameter { value = new Color(0.8f, 0.9f, 1.0f) };
    [Range(0f, 1f)] public FloatParameter depth = new FloatParameter { value = 0.8f };
    public BoolParameter motionReduced = new BoolParameter { value = false };
}

[System.Serializable]
public class RunicGlow : PostProcessEffectSettings
{
    [Range(0f, 1f)] public FloatParameter strength = new FloatParameter { value = 0.5f };
    public ColorParameter primaryColor = new ColorParameter { value = new Color(1.0f, 0.8f, 0.4f) };
    public ColorParameter secondaryColor = new ColorParameter { value = new Color(0.6f, 0.4f, 0.8f) };
    [Range(0.1f, 3f)] public FloatParameter speed = new FloatParameter { value = 1.0f };
}

[System.Serializable]
public class SacralVignette : PostProcessEffectSettings
{
    [Range(0f, 1f)] public FloatParameter strength = new FloatParameter { value = 0.4f };
    public ColorParameter tint = new ColorParameter { value = new Color(0.9f, 0.6f, 0.8f) };
    [Range(0.1f, 0.8f)] public FloatParameter borderWidth = new FloatParameter { value = 0.4f };
}

[System.Serializable]
public class MelancholyGrade : PostProcessEffectSettings
{
    [Range(0f, 1f)] public FloatParameter strength = new FloatParameter { value = 0.3f };
    public ColorParameter shadowTint = new ColorParameter { value = new Color(0.4f, 0.5f, 0.6f) };
    public ColorParameter highlightTint = new ColorParameter { value = new Color(0.9f, 0.8f, 0.3f) };
    [Range(0.5f, 2f)] public FloatParameter contrast = new FloatParameter { value = 1.1f };
}
