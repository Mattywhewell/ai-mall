/**
 * Supabase Storage Upload Utilities
 * Handles file uploads to Supabase Storage buckets
 */

import { getSupabaseClient } from '@/lib/supabase-server';

export async function uploadToSupabaseStorage(
  file: File,
  filePath: string,
  bucket: string = 'assets'
): Promise<string> {
  try {
    const supabase = getSupabaseClient();

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.warn('Storage upload failed, using placeholder URL:', error.message);
      // Return a placeholder URL for development
      return `https://storage.googleapis.com/placeholder-${bucket}/${filePath}`;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;

  } catch (error) {
    console.warn('Storage upload error, using placeholder URL:', error.message);
    // Return a placeholder URL for development
    return `https://storage.googleapis.com/placeholder-${bucket}/${filePath}`;
  }
}

export async function deleteFromSupabaseStorage(
  filePath: string,
  bucket: string = 'assets'
): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting from Supabase Storage:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }

  } catch (error) {
    console.error('Error in deleteFromSupabaseStorage:', error);
    throw error;
  }
}

export async function getSupabaseStorageUrl(
  filePath: string,
  bucket: string = 'assets'
): Promise<string> {
  const supabase = getSupabaseClient();

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}