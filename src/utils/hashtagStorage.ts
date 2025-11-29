import { supabase } from '@/integrations/supabase/client';
import { extractHashtags } from './hashtagUtils';

/**
 * Store hashtags in the post_hashtag table
 * Extracts hashtags from content, converts to lowercase, and stores them
 * Avoids duplicates per post using the unique constraint
 */
export async function storePostHashtags(postId: string, content: string): Promise<void> {
  try {
    // Extract hashtags from content (returns lowercase without #)
    const hashtags = extractHashtags(content);
    
    if (hashtags.length === 0) {
      return; // No hashtags to store
    }

    // Prepare hashtag records (avoiding duplicates)
    const hashtagRecords = hashtags.map(hashtag => ({
      post_id: postId,
      hashtag: hashtag.toLowerCase() // Ensure lowercase
    }));

    // Insert hashtags (the unique constraint will prevent duplicates)
    // Use upsert to handle potential race conditions gracefully
    const { error } = await supabase
      .from('post_hashtag')
      .upsert(hashtagRecords, {
        onConflict: 'post_id,hashtag',
        ignoreDuplicates: false
      });

    if (error) {
      // If it's a duplicate key error, that's fine - just log it
      if (error.code === '23505') {
        console.log('Some hashtags already exist for this post, skipping duplicates');
      } else {
        console.error('Error storing hashtags:', error);
        // Don't throw - hashtag storage failure shouldn't break post creation
      }
    }
  } catch (error) {
    console.error('Unexpected error storing hashtags:', error);
    // Don't throw - hashtag storage failure shouldn't break post creation
  }
}

/**
 * Delete all hashtags for a post (useful when editing/deleting posts)
 */
export async function deletePostHashtags(postId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('post_hashtag')
      .delete()
      .eq('post_id', postId);

    if (error) {
      console.error('Error deleting hashtags:', error);
    }
  } catch (error) {
    console.error('Unexpected error deleting hashtags:', error);
  }
}

/**
 * Update hashtags for a post (delete old ones and insert new ones)
 */
export async function updatePostHashtags(postId: string, content: string): Promise<void> {
  // Delete existing hashtags
  await deletePostHashtags(postId);
  // Store new hashtags
  await storePostHashtags(postId, content);
}

