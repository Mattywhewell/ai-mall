/**
 * 3D Model Generation from Images using Tripo3D API
 * This module provides functions to generate 3D models from 2D images
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

// Submit image for 3D model generation
export async function generate_3d_model_from_image(imageUrl: string, jobId: string): Promise<string> {
  try {
    console.log(`Starting 3D model generation for job ${jobId} from image: ${imageUrl}`);

    if (!TRIPO3D_API_KEY) {
      throw new Error('TRIPO3D_API_KEY not configured');
    }

    // Step 1: Upload image to Tripo3D and start generation
    const taskResponse = await fetch(`${TRIPO3D_API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TRIPO3D_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'image_to_3d',
        file: {
          url: imageUrl,
        },
        options: {
          // Tripo3D specific options
          quality: 'high',
          format: 'glb',
        },
      }),
    });

    if (!taskResponse.ok) {
      const error = await taskResponse.text();
      throw new Error(`Tripo3D API error: ${error}`);
    }

    const taskData: Tripo3DTask = await taskResponse.json();
    const taskId = taskData.task_id;

    console.log(`Tripo3D task created: ${taskId}`);

    // Step 2: Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals

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
        const modelUrl = statusData.result.model.url;
        console.log(`3D model generation completed for job ${jobId}: ${modelUrl}`);

        // Step 3: Download and upload to our storage
        const uploadedModelUrl = await uploadGeneratedModel(modelUrl, jobId);
        return uploadedModelUrl;
      } else if (statusData.status === 'failed') {
        throw new Error('3D model generation failed');
      }

      attempts++;
      console.log(`Task ${taskId} progress: ${statusData.progress || 0}%`);
    }

    throw new Error('3D model generation timed out');

  } catch (error) {
    console.error('Error generating 3D model:', error);
    throw new Error(`3D model generation failed: ${error.message}`);
  }
}

// Download generated model from Tripo3D and upload to Supabase
async function uploadGeneratedModel(modelUrl: string, jobId: string): Promise<string> {
  try {
    // Download the model file
    const response = await fetch(modelUrl);
    if (!response.ok) {
      throw new Error('Failed to download generated model');
    }

    const modelBlob = await response.blob();
    const modelFile = new File([modelBlob], `generated-model-${jobId}.glb`, {
      type: 'model/gltf-binary',
    });

    // Upload to Supabase storage
    const modelPath = `admin-assets/models/${jobId}.glb`;
    const uploadedModelUrl = await uploadToSupabaseStorage(modelFile, modelPath, 'assets');

    return uploadedModelUrl;
  } catch (error) {
    console.error('Error uploading generated model:', error);
    // Return the original URL as fallback
    return modelUrl;
  }
}

// Function to check generation status (for polling)
export async function checkGenerationStatus(jobId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  resultUrl?: string;
  error?: string;
}> {
  // In production, this would check the external API status
  // For now, simulate random completion
  const random = Math.random();

  if (random < 0.1) {
    return { status: 'pending', progress: Math.floor(Math.random() * 30) };
  } else if (random < 0.8) {
    return { status: 'processing', progress: 30 + Math.floor(Math.random() * 60) };
  } else if (random < 0.95) {
    return {
      status: 'completed',
      progress: 100,
      resultUrl: `https://storage.googleapis.com/placeholder-3d-models/generated-model-${jobId}.glb`
    };
  } else {
    return {
      status: 'failed',
      error: 'Generation failed due to invalid input'
    };
  }
}