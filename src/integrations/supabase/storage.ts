import { supabase } from "./client";

/**
 * Upload an image to the post-images bucket (for post images)
 * This is an alias for uploadPostImage with simpler return format
 */
export async function uploadCommunityImage(file: File, communityId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const result = await uploadPostImage(file, communityId, user.id);
  return result.url;
}

/**
 * Upload an image to the post-images bucket (for community and regular posts)
 * Uses the existing post-images bucket that's already configured
 */
export async function uploadPostImage(file: File, communityId: string, userId: string): Promise<{ url: string; path: string }> {
  // Use the existing post-images bucket that's already set up
  const bucket = "post-images";

  try {
    // Create unique path with folder structure: userId/timestamp.ext
    // For community posts, we can still organize by community in the path
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${timestamp}.${fileExt}`;

    // Path structure: userId/communityId_timestamp.ext or userId/timestamp.ext
    const path = communityId
      ? `${userId}/community_${communityId}_${fileName}`
      : `${userId}/${fileName}`;

    console.log(`Uploading to bucket: ${bucket}, path: ${path}`);

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("Upload error:", error);

      // Provide helpful error messages
      if (error.message.includes('Bucket not found')) {
        throw new Error(`Storage bucket "${bucket}" not found. Please ensure your Supabase storage is configured correctly.`);
      } else if (error.message.includes('new row violates row-level security')) {
        throw new Error('Permission denied. Please ensure you are logged in and have permission to upload images.');
      } else if (error.message.includes('The resource already exists')) {
        // File already exists, try with a different timestamp
        const newPath = `${userId}/community_${communityId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data: retryData, error: retryError } = await supabase.storage
          .from(bucket)
          .upload(newPath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (retryError) {
          throw new Error(`Upload failed: ${retryError.message}`);
        }

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(newPath);
        return {
          url: urlData.publicUrl,
          path: newPath
        };
      } else {
        throw new Error(`Upload failed: ${error.message}`);
      }
    }

    if (!data) {
      throw new Error('Upload succeeded but no data returned');
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

    console.log(`Upload successful! URL: ${urlData.publicUrl}`);

    return {
      url: urlData.publicUrl,
      path: path
    };
  } catch (error: any) {
    console.error("uploadPostImage error:", error);
    throw error;
  }
}

/**
 * Delete an image from storage
 */
export async function deleteStorageImage(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error("Delete error:", error);
    throw error;
  }
}
