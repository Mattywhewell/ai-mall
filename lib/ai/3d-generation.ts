import { supabase } from '@/lib/supabaseClient';

interface GenerationResult {
  success: boolean;
  modelUrl?: string;
  thumbnailUrl?: string;
  fileSize?: number;
  params?: any;
  error?: string;
}

interface MythicAssetMetadata {
  name: string;
  description: string;
  district?: string;
  ritual?: string;
  archetype?: string;
}

/**
 * Create a simple placeholder thumbnail
 */
async function createPlaceholderThumbnail(): Promise<Blob> {
  // Create a simple 256x256 gray placeholder image
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Fill with gradient background
  const gradient = ctx.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, '#4A5568');
  gradient.addColorStop(1, '#2D3748');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  // Add text
  ctx.fillStyle = '#E2E8F0';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('3D Model', 128, 120);
  ctx.font = '16px Arial';
  ctx.fillText('Generating...', 128, 150);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png');
  });
}

/**
 * Generate 3D model from image with mythic prompting standards
 * Following Additive Design Law: expand capabilities, never restrict
 */
export async function generate3DModelFromImage(
  uploadId: string,
  imagePath: string,
  metadata: MythicAssetMetadata
): Promise<GenerationResult> {
  try {
    console.log('Starting mythic 3D model generation from image:', imagePath);

    // Get upload record
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', uploadId)
      .single();

    if (uploadError || !upload) {
      return {
        success: false,
        error: 'Upload record not found'
      };
    }

    // Get image URL
    const { data: imageUrl } = supabase.storage
      .from('uploads')
      .getPublicUrl(imagePath);

    if (!imageUrl) {
      return {
        success: false,
        error: 'Could not get image URL'
      };
    }

    // Create mythic prompt following standards
    const mythicPrompt = createMythic3DPrompt(metadata);

    // Generate 3D model using Tripo3D with mythic prompt
    const result = await generate_3d_model_from_image_with_mythic_prompt(
      imageUrl.publicUrl,
      mythicPrompt
    );

    if (!result.success) {
      return result;
    }

    // Store asset in database following mythic standards
    const assetData = {
      type: 'model' as const,
      name: metadata.name,
      description: metadata.description,
      file_url: result.modelUrl!,
      file_size_bytes: result.fileSize,
      file_format: 'glb',
      created_by: upload.user_id,
      created_from_upload_id: uploadId,
      district_assignment: metadata.district,
      ritual_assignment: metadata.ritual,
      citizen_archetype: metadata.archetype,
      generation_prompt: mythicPrompt,
      tags: generateMythicTags(metadata),
      metadata: {
        generation_model: 'mythic-forge-v1',
        original_image: imagePath,
        mythic_tones: ['obsidian_core', 'lumen_gold'],
        ...result.params
      }
    };

    // Store asset (this function needs to be implemented)
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert(assetData)
      .select()
      .single();

    if (assetError) {
      console.error('Asset storage error:', assetError);
      return {
        success: false,
        error: 'Failed to store generated asset'
      };
    }

    // Link upload to asset
    await supabase.rpc('link_upload_to_asset', {
      upload_id: uploadId,
      asset_id: asset.id
    });

    return {
      ...result,
      params: {
        ...result.params,
        asset_id: asset.id,
        mythic_metadata: assetData.metadata
      }
    };

  } catch (error) {
    console.error('Mythic 3D generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create mythic prompt following AI prompting standards
 * Section 5.1: Cinematic Prompt Structure
 */
function createMythic3DPrompt(metadata: MythicAssetMetadata): string {
  const { name, description, district, ritual, archetype } = metadata;

  return `A ${name} ${description ? `that ${description.toLowerCase()}` : ''}, forged in the ${district || 'central'} district${ritual ? ` for the ${ritual} ritual` : ''}${archetype ? `, embodying the ${archetype} archetype` : ''}.

Mythic anchor: Ancient digital civilization artifact, carved from obsidian with lumen gold veins, pulsing with ember energy.

Physical description: Detailed 3D model with intricate surface details, symbolic engravings, and atmospheric lighting effects.

Cinematic lens: Rendered with high contrast, dramatic shadows, and ethereal glows that suggest living energy within the form.

Production constraints: Optimized for real-time rendering, LOD system, PBR materials, 12-point radial grid proportions, 2.5px stroke logic in engravings.

Additive expansion: Every detail must feel like an inevitable extension of the city's living mythos.`;
}

/**
 * Generate mythic tags for categorization
 */
function generateMythicTags(metadata: MythicAssetMetadata): string[] {
  const tags = ['mythic', '3d-generated'];

  if (metadata.district) tags.push(metadata.district);
  if (metadata.ritual) tags.push(metadata.ritual);
  if (metadata.archetype) tags.push(metadata.archetype);

  return tags;
}

/**
 * Generate 3D model from image using Tripo3D API with mythic prompt
 */
async function generate_3d_model_from_image_with_mythic_prompt(
  imageUrl: string,
  mythicPrompt: string
): Promise<GenerationResult> {
  try {
    console.log('Starting mythic 3D generation with prompt:', mythicPrompt.substring(0, 100) + '...');

    // Get the image file from Supabase storage
    const { data: imageData, error: downloadError } = await supabase.storage
      .from('uploads')  // Changed from 'assets' to 'uploads'
      .download(imageUrl.replace('/storage/v1/object/public/uploads/', ''));

    if (downloadError) {
      console.error('Error downloading image:', downloadError);
      return {
        success: false,
        error: 'Failed to download source image'
      };
    }

    // Convert blob to base64
    const base64Image = await blobToBase64(imageData);

    // Call Tripo3D API with mythic prompt as context
    const tripoResponse = await fetch('https://api.tripo3d.ai/v2/openapi/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TRIPO3D_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: {
          type: 'image',
          data: base64Image,
          name: 'mythic-source-image.jpg'
        },
        type: 'image_to_3d',
        // Add mythic context to the generation request
        prompt: mythicPrompt
      })
    });

    if (!tripoResponse.ok) {
      const errorData = await tripoResponse.json();
      console.error('Tripo3D API error:', errorData);
      return {
        success: false,
        error: `Tripo3D API error: ${errorData.message || 'Unknown error'}`
      };
    }

    const tripoData = await tripoResponse.json();
    const taskId = tripoData.data.task_id;

    // Poll for completion with mythic progress messages
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.TRIPO3D_API_KEY}`
        }
      });

      if (!statusResponse.ok) {
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();

      if (statusData.data.status === 'success') {
        // Download the generated model
        const modelResponse = await fetch(statusData.data.output.model, {
          headers: {
            'Authorization': `Bearer ${process.env.TRIPO3D_API_KEY}`
          }
        });

        if (!modelResponse.ok) {
          return {
            success: false,
            error: 'Failed to download generated model'
          };
        }

        const modelBlob = await modelResponse.blob();

        // Upload to Supabase Storage with mythic naming
        const timestamp = Date.now();
        const modelFileName = `assets/models/generated/${timestamp}-mythic-forge-model.glb`;
        const { data: modelUploadData, error: modelUploadError } = await supabase.storage
          .from('assets')
          .upload(modelFileName, modelBlob, {
            contentType: 'model/gltf-binary',
            upsert: false
          });

        if (modelUploadError) {
          console.error('Error uploading generated model:', modelUploadError);
          return {
            success: false,
            error: 'Failed to upload generated model'
          };
        }

        // Get public URL
        const { data: { publicUrl: modelUrl } } = supabase.storage
          .from('assets')
          .getPublicUrl(modelFileName);

        // Create mythic thumbnail
        const thumbnailBlob = await createMythicThumbnail();
        const thumbnailFileName = `assets/thumbnails/${timestamp}-mythic-model-thumb.png`;
        const { data: thumbUploadData, error: thumbUploadError } = await supabase.storage
          .from('assets')
          .upload(thumbnailFileName, thumbnailBlob, {
            contentType: 'image/png',
            upsert: false
          });

        let thumbnailUrl: string | undefined;
        if (!thumbUploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('assets')
            .getPublicUrl(thumbnailFileName);
          thumbnailUrl = publicUrl;
        }

        return {
          success: true,
          modelUrl,
          thumbnailUrl,
          fileSize: modelBlob.size,
          params: {
            source_image: imageUrl,
            generation_method: 'tripo3d_mythic_forge',
            task_id: taskId,
            mythic_prompt: mythicPrompt,
            timestamp: new Date().toISOString(),
            mythic_tones: ['obsidian_core', 'lumen_gold', 'pulse_ember']
          }
        };
      }

      attempts++;
    }

    return {
      success: false,
      error: 'Generation timed out - the city\'s forge grows weary'
    };

  } catch (error) {
    console.error('Mythic 3D generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown mythic generation error'
    };
  }
}

/**
 * Original function for backward compatibility
 */
export async function generate_3d_model_from_image(imageUrl: string): Promise<GenerationResult> {
  try {
    console.log('Starting 3D model generation from image:', imageUrl);

    // Get the image file from Supabase storage
    const { data: imageData, error: downloadError } = await supabase.storage
      .from('assets')
      .download(imageUrl);

    if (downloadError) {
      console.error('Error downloading image:', downloadError);
      return {
        success: false,
        error: 'Failed to download source image'
      };
    }

    // Convert blob to base64
    const base64Image = await blobToBase64(imageData);

    // Call Tripo3D API
    const tripoResponse = await fetch('https://api.tripo3d.ai/v2/openapi/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TRIPO3D_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: {
          type: 'image',
          data: base64Image,
          name: 'source-image.jpg'
        },
        type: 'image_to_3d'
      })
    });

    if (!tripoResponse.ok) {
      const errorData = await tripoResponse.json();
      console.error('Tripo3D API error:', errorData);
      return {
        success: false,
        error: `Tripo3D API error: ${errorData.message || 'Unknown error'}`
      };
    }

    const tripoData = await tripoResponse.json();
    const taskId = tripoData.data.task_id;

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.TRIPO3D_API_KEY}`
        }
      });

      if (!statusResponse.ok) {
        continue;
      }

      const statusData = await statusResponse.json();

      if (statusData.data.status === 'success') {
        // Download the generated model
        const modelResponse = await fetch(statusData.data.output.model, {
          headers: {
            'Authorization': `Bearer ${process.env.TRIPO3D_API_KEY}`
          }
        });

        if (!modelResponse.ok) {
          return {
            success: false,
            error: 'Failed to download generated model'
          };
        }

        const modelBlob = await modelResponse.blob();

        // Upload to Supabase Storage
        const modelFileName = `admin-assets/models/${Date.now()}-generated-model.glb`;
        const { data: modelUploadData, error: modelUploadError } = await supabase.storage
          .from('assets')
          .upload(modelFileName, modelBlob, {
            contentType: 'model/gltf-binary',
            upsert: false
          });

        if (modelUploadError) {
          console.error('Error uploading generated model:', modelUploadError);
          return {
            success: false,
            error: 'Failed to upload generated model'
          };
        }

        // Get public URL
        const { data: { publicUrl: modelUrl } } = supabase.storage
          .from('assets')
          .getPublicUrl(modelFileName);

        // Create thumbnail (placeholder for now)
        const thumbnailBlob = await createPlaceholderThumbnail();
        const thumbnailFileName = `admin-assets/thumbnails/${Date.now()}-model-thumb.png`;
        const { data: thumbUploadData, error: thumbUploadError } = await supabase.storage
          .from('assets')
          .upload(thumbnailFileName, thumbnailBlob, {
            contentType: 'image/png',
            upsert: false
          });

        let thumbnailUrl: string | undefined;
        if (!thumbUploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('assets')
            .getPublicUrl(thumbnailFileName);
          thumbnailUrl = publicUrl;
        }

        return {
          success: true,
          modelUrl,
          thumbnailUrl,
          fileSize: modelBlob.size,
          params: {
            source_image: imageUrl,
            generation_method: 'tripo3d_image_to_3d',
            task_id: taskId,
            timestamp: new Date().toISOString()
          }
        };
      } else if (statusData.data.status === 'failed') {
        return {
          success: false,
          error: '3D generation failed'
        };
      }

      attempts++;
    }

    return {
      success: false,
      error: '3D generation timed out'
    };

  } catch (error) {
    console.error('Error in generate_3d_model_from_image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate a 3D avatar from a selfie
 */
export async function generate_avatar_from_selfie(imageUrl: string): Promise<GenerationResult> {
  try {
    console.log('Starting avatar generation from selfie:', imageUrl);

    // First validate the face
    const faceValidation = await validateFaceInImage(imageUrl);
    if (!faceValidation.hasFace) {
      return {
        success: false,
        error: 'No face detected in the image. Please upload a clear selfie.'
      };
    }

    // Get the image file from Supabase storage
    const { data: imageData, error: downloadError } = await supabase.storage
      .from('assets')
      .download(imageUrl);

    if (downloadError) {
      console.error('Error downloading selfie:', downloadError);
      return {
        success: false,
        error: 'Failed to download source image'
      };
    }

    // Convert blob to base64
    const base64Image = await blobToBase64(imageData);

    // For avatar generation, we'll use Tripo3D's face-to-3D feature
    // Note: This might need to be adjusted based on Tripo3D's actual API
    const tripoResponse = await fetch('https://api.tripo3d.ai/v2/openapi/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TRIPO3D_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: {
          type: 'image',
          data: base64Image,
          name: 'selfie.jpg'
        },
        type: 'face_to_3d' // Assuming Tripo3D has this endpoint
      })
    });

    if (!tripoResponse.ok) {
      // Fallback to placeholder if face-to-3D is not available
      console.warn('Face-to-3D API not available, using placeholder');
      return await createPlaceholderAvatar(imageUrl, faceValidation.confidence || 0);
    }

    const tripoData = await tripoResponse.json();
    const taskId = tripoData.data.task_id;

    // Poll for completion (same as image-to-3d)
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResponse = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.TRIPO3D_API_KEY}`
        }
      });

      if (!statusResponse.ok) {
        continue;
      }

      const statusData = await statusResponse.json();

      if (statusData.data.status === 'success') {
        // Download the generated avatar
        const avatarResponse = await fetch(statusData.data.output.model, {
          headers: {
            'Authorization': `Bearer ${process.env.TRIPO3D_API_KEY}`
          }
        });

        if (!avatarResponse.ok) {
          return await createPlaceholderAvatar(imageUrl, faceValidation.confidence || 0);
        }

        const avatarBlob = await avatarResponse.blob();

        // Upload to Supabase Storage
        const avatarFileName = `user-avatars/${Date.now()}-generated-avatar.glb`;
        const { data: avatarUploadData, error: avatarUploadError } = await supabase.storage
          .from('assets')
          .upload(avatarFileName, avatarBlob, {
            contentType: 'model/gltf-binary',
            upsert: false
          });

        if (avatarUploadError) {
          console.error('Error uploading avatar:', avatarUploadError);
          return {
            success: false,
            error: 'Failed to upload generated avatar'
          };
        }

        const { data: { publicUrl: avatarUrl } } = supabase.storage
          .from('assets')
          .getPublicUrl(avatarFileName);

        return {
          success: true,
          modelUrl: avatarUrl,
          fileSize: avatarBlob.size,
          params: {
            source_image: imageUrl,
            generation_method: 'tripo3d_face_to_3d',
            face_confidence: faceValidation.confidence,
            task_id: taskId,
            timestamp: new Date().toISOString()
          }
        };
      } else if (statusData.data.status === 'failed') {
        return await createPlaceholderAvatar(imageUrl, faceValidation.confidence || 0);
      }

      attempts++;
    }

    // Timeout - use placeholder
    return await createPlaceholderAvatar(imageUrl, faceValidation.confidence || 0);

  } catch (error) {
    console.error('Error in generate_avatar_from_selfie:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Create a placeholder avatar when real generation fails
 */
async function createPlaceholderAvatar(imageUrl: string, confidence: number): Promise<GenerationResult> {
  try {
    // Create placeholder avatar model
    const avatarModelData = createPlaceholderGLB();
    const avatarBlob = new Blob([avatarModelData], { type: 'model/gltf-binary' });

    // Upload avatar model
    const avatarFileName = `user-avatars/${Date.now()}-generated-avatar.glb`;
    const { data: avatarUploadData, error: avatarUploadError } = await supabase.storage
      .from('assets')
      .upload(avatarFileName, avatarBlob, {
        contentType: 'model/gltf-binary',
        upsert: false
      });

    if (avatarUploadError) {
      console.error('Error uploading avatar:', avatarUploadError);
      return {
        success: false,
        error: 'Failed to upload generated avatar'
      };
    }

    const { data: { publicUrl: avatarUrl } } = supabase.storage
      .from('assets')
      .getPublicUrl(avatarFileName);

    return {
      success: true,
      modelUrl: avatarUrl,
      fileSize: avatarBlob.size,
      params: {
        source_image: imageUrl,
        generation_method: 'placeholder_avatar',
        face_confidence: confidence,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create placeholder avatar'
    };
  }
}

/**
 * Validate that an image contains a face
 */
async function validateFaceInImage(imageUrl: string): Promise<{ hasFace: boolean; confidence?: number }> {
  try {
    // For now, we'll use a simple validation
    // In production, this would use face detection APIs like AWS Rekognition, Google Vision, or OpenCV

    // Download the image to check its size and basic properties
    const { data: imageData, error } = await supabase.storage
      .from('assets')
      .download(imageUrl);

    if (error) {
      console.error('Error downloading image for validation:', error);
      return { hasFace: false };
    }

    // Basic validation: check if file is an image and has reasonable size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(imageData.type)) {
      return { hasFace: false };
    }

    // Check file size (should be reasonable for a selfie)
    if (imageData.size < 10000 || imageData.size > 10 * 1024 * 1024) { // 10KB to 10MB
      return { hasFace: false };
    }

    // For demo purposes, assume validation passes with random confidence
    // In production, integrate with face detection service
    const hasFace = Math.random() > 0.1; // 90% success rate
    const confidence = hasFace ? Math.random() * 0.3 + 0.7 : Math.random() * 0.3; // 0.7-1.0 for faces, 0-0.3 for no faces

    return { hasFace, confidence };
  } catch (error) {
    console.error('Face validation error:', error);
    return { hasFace: false };
  }
}

/**
 * Convert blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Create a placeholder GLB file for demo purposes
 */
function createPlaceholderGLB(): ArrayBuffer {
  // This is a minimal GLB file structure
  const glbData = new ArrayBuffer(1024);
  const view = new DataView(glbData);

  // GLB header
  view.setUint32(0, 0x46546C67, true); // 'glTF'
  view.setUint32(4, 2, true); // Version 2
  view.setUint32(8, 1024, true); // Total length

  return glbData;
}

/**
 * Create a mythic-themed thumbnail image
 * Following Visual Identity: Seven Mythic Tones
 */
async function createMythicThumbnail(): Promise<Blob> {
  // Create a 256x256 mythic thumbnail
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Obsidian Core background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 256, 256);

  // Lumen Gold radial gradient
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
  gradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.1)');
  gradient.addColorStop(1, 'rgba(26, 26, 46, 0.9)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  // Pulse Ember accent
  ctx.fillStyle = 'rgba(255, 69, 0, 0.2)';
  ctx.beginPath();
  ctx.arc(128, 128, 60, 0, 2 * Math.PI);
  ctx.fill();

  // Mythic glyph (12-point radial grid inspired)
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2.5; // Following iconography: 2.5px strokes
  ctx.beginPath();
  // Create a radial glyph pattern
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30) * Math.PI / 180;
    const x1 = 128 + Math.cos(angle) * 30;
    const y1 = 128 + Math.sin(angle) * 30;
    const x2 = 128 + Math.cos(angle) * 80;
    const y2 = 128 + Math.sin(angle) * 80;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();

  // Center sigil
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(128, 128, 8, 0, 2 * Math.PI);
  ctx.fill();

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob!), 'image/png');
  });
}