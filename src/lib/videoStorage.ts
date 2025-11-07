import { supabase } from './supabase';

/**
 * Upload a video file to Supabase Storage
 * @param file - The video file to upload
 * @param courseId - The course ID this video belongs to
 * @param lessonId - The lesson ID this video is for
 * @returns The storage path of the uploaded video
 */
export async function uploadVideo(
  file: File,
  courseId: string,
  lessonId: string
): Promise<{ path: string; error: string | null }> {
  try {
    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      return {
        path: '',
        error: 'Invalid file type. Please upload MP4, WebM, OGG, or MOV files.',
      };
    }

    // Validate file size (max 50MB - Supabase free tier limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return {
        path: '',
        error: 'File too large. Maximum size is 50MB. Consider using external video hosting (YouTube/Vimeo) for larger files.',
      };
    }

    // Create a unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${lessonId}_${timestamp}.${extension}`;
    const filePath = `courses/${courseId}/lessons/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { path: '', error: uploadError.message };
    }

    return { path: filePath, error: null };
  } catch (error: any) {
    console.error('Video upload error:', error);
    return { path: '', error: error.message || 'Failed to upload video' };
  }
}

/**
 * Get a signed URL for a video (valid for 1 hour)
 * @param path - The storage path of the video
 * @returns The signed URL
 */
export async function getVideoUrl(path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('videos')
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) {
      console.error('Error getting video URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting video URL:', error);
    return null;
  }
}

/**
 * Delete a video from storage
 * @param path - The storage path of the video to delete
 * @returns Success status
 */
export async function deleteVideo(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from('videos').remove([path]);

    if (error) {
      console.error('Error deleting video:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting video:', error);
    return false;
  }
}

/**
 * Get public URL for a video (if bucket is public)
 * Note: Use signed URLs for private videos instead
 * @param path - The storage path of the video
 * @returns The public URL
 */
export function getPublicVideoUrl(path: string): string {
  const { data } = supabase.storage.from('videos').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Format bytes to human-readable size
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate video file
 * @param file - File to validate
 * @returns Error message or null if valid
 */
export function validateVideoFile(file: File): string | null {
  const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  if (!validTypes.includes(file.type)) {
    return 'Invalid file type. Please upload MP4, WebM, OGG, or MOV files.';
  }

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return 'File too large. Maximum size is 50MB. Consider using external video hosting (YouTube/Vimeo) for larger files.';
  }

  return null;
}
