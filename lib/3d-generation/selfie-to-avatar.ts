/**
 * 3D Avatar Generation from Selfies using Tripo3D API
 * This module provides functions to generate 3D avatars from selfie images
 * using Tripo3D's AI-powered 3D reconstruction service
 */

import { uploadToSupabaseStorage } from '@/lib/storage/upload';

const TRIPO3D_API_BASE = 'https://api.tripo3d.ai/v1';
const TRIPO3D_API_KEY = process.env.TRIPO3D_API_KEY;

// Interface for Tripo3D task response
interface Tripo3DTask {
  task_id: string;
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: {
    model: {
      url: string;
    };
  };
}

export async function generate_avatar_from_selfie(selfieUrl: string, avatarId: string): Promise<string> {
  try {
    console.log(`Starting avatar generation for avatar ${avatarId} from selfie: ${selfieUrl}`);

    if (!TRIPO3D_API_KEY) {
      throw new Error('TRIPO3D_API_KEY not configured');
    }

    // Step 1: Upload selfie to Tripo3D and start avatar generation
    const taskResponse = await fetch(`${TRIPO3D_API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TRIPO3D_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'image_to_3d',
        file: {
          url: selfieUrl,
        },
        options: {
          // Tripo3D options optimized for avatars
          quality: 'high',
          format: 'glb',
          style: 'realistic', // Better for avatars
          texture_size: 1024,
        },
      }),
    });

    if (!taskResponse.ok) {
      const error = await taskResponse.text();
      throw new Error(`Tripo3D API error: ${error}`);
    }

    const taskData: Tripo3DTask = await taskResponse.json();
    const taskId = taskData.task_id;

    console.log(`Tripo3D avatar task created: ${taskId}`);

    // Step 2: Poll for completion (avatars might take longer)
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes with 5-second intervals

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(`${TRIPO3D_API_BASE}/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${TRIPO3D_API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to check task status');
      }

      const statusData: Tripo3DTask = await statusResponse.json();

      if (statusData.status === 'completed' && statusData.result?.model?.url) {
        const avatarUrl = statusData.result.model.url;
        console.log(`Avatar generation completed for avatar ${avatarId}: ${avatarUrl}`);

        // Step 3: Download and upload to our storage
        const uploadedAvatarUrl = await uploadGeneratedAvatar(avatarUrl, avatarId);
        return uploadedAvatarUrl;
      } else if (statusData.status === 'failed') {
        throw new Error('Avatar generation failed');
      }

      attempts++;
      console.log(`Avatar task ${taskId} progress: ${statusData.progress || 0}%`);
    }

    throw new Error('Avatar generation timed out');

  } catch (error) {
    console.error('Error generating avatar:', error);
    throw new Error(`Avatar generation failed: ${error.message}`);
  }
}

// Download generated avatar from Tripo3D and upload to Supabase
async function uploadGeneratedAvatar(avatarUrl: string, avatarId: string): Promise<string> {
  try {
    // Download the avatar file
    const response = await fetch(avatarUrl);
    if (!response.ok) {
      throw new Error('Failed to download generated avatar');
    }

    const avatarBlob = await response.blob();
    const avatarFile = new File([avatarBlob], `generated-avatar-${avatarId}.glb`, {
      type: 'model/gltf-binary',
    });

    // Upload to Supabase storage
    const avatarPath = `user-avatars/models/${avatarId}.glb`;
    const uploadedAvatarUrl = await uploadToSupabaseStorage(avatarFile, avatarPath, 'avatars');

    return uploadedAvatarUrl;
  } catch (error) {
    console.error('Error uploading generated avatar:', error);
    // Return the original URL as fallback
    return avatarUrl;
  }
}

// Function to validate selfie image (face detection)
export async function validateSelfie(selfieUrl: string): Promise<{
  isValid: boolean;
  hasFace: boolean;
  faceCount: number;
  confidence: number;
  error?: string;
}> {
  try {
    // In production, this would use face detection API
    // For now, simulate validation
    await new Promise(resolve => setTimeout(resolve, 1000));

    const random = Math.random();
    if (random < 0.1) {
      return {
        isValid: false,
        hasFace: false,
        faceCount: 0,
        confidence: 0,
        error: 'No face detected in image'
      };
    } else if (random < 0.2) {
      return {
        isValid: false,
        hasFace: true,
        faceCount: 2,
        confidence: 0.8,
        error: 'Multiple faces detected - please use a selfie with only one person'
      };
    } else {
      return {
        isValid: true,
        hasFace: true,
        faceCount: 1,
        confidence: 0.85 + (random * 0.1) // 0.85-0.95 confidence
      };
    }

  } catch (error) {
    console.error('Error validating selfie:', error);
    return {
      isValid: false,
      hasFace: false,
      faceCount: 0,
      confidence: 0,
      error: 'Failed to validate image'
    };
  }
}

// Function to check avatar generation status
export async function checkAvatarGenerationStatus(avatarId: string): Promise<{
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  avatarUrl?: string;
  error?: string;
}> {
  // In production, this would check the external API status
  // For now, simulate random completion
  const random = Math.random();

  if (random < 0.2) {
    return { status: 'processing', progress: Math.floor(Math.random() * 50) };
  } else if (random < 0.9) {
    return { status: 'processing', progress: 50 + Math.floor(Math.random() * 40) };
  } else if (random < 0.98) {
    return {
      status: 'completed',
      progress: 100,
      avatarUrl: `https://storage.googleapis.com/placeholder-avatars/generated-avatar-${avatarId}.glb`
    };
  } else {
    return {
      status: 'failed',
      error: 'Avatar generation failed - please try with a clearer selfie'
    };
  }
}

// Helper function to download file from external API
async function downloadFromExternalAPI(url: string): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download avatar: ${response.statusText}`);
  }

  const blob = await response.blob();
  return new File([blob], 'generated-avatar.glb', { type: 'model/gltf-binary' });
}