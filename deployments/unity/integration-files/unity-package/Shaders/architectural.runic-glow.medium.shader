Shader "Hidden/Mythic/architectural.runic glow.medium"
{
    Properties
    {
        _Strength ("Strength", Range(0,1)) = 0.6
        _Tint ("Tint", Color) = (0.8,0.9,1.0,1)
        _Depth ("Depth", Range(0,1)) = 0.8
        _MotionReduced ("Motion Reduced", Float) = 0
    }

    SubShader
    {
        Tags { "RenderType"="Opaque" "RenderPipeline"="UniversalPipeline" }
        LOD 100
        ZWrite Off ZTest Always Cull Off

        Pass
        {
            Name "Mythic Effect"

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            struct Attributes
            {
                float4 positionOS : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct Varyings
            {
                float4 positionHCS : SV_POSITION;
                float2 uv : TEXCOORD0;
            };

            TEXTURE2D(_MainTex);
            SAMPLER(sampler_MainTex);

            CBUFFER_START(UnityPerMaterial)
                float _Strength;
                float4 _Tint;
                float _Depth;
                float _MotionReduced;
            CBUFFER_END

            Varyings vert(Attributes IN)
            {
                Varyings OUT;
                OUT.positionHCS = TransformObjectToHClip(IN.positionOS.xyz);
                OUT.uv = IN.uv;
                return OUT;
            }

            half4 frag(Varyings IN) : SV_Target
            {
                half4 color = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, IN.uv);

                // Apply mythic effect (simplified)
                color.rgb = lerp(color.rgb, _Tint.rgb * color.rgb, _Strength * _Depth);

                return color;
            }
            ENDHLSL
        }
    }
}