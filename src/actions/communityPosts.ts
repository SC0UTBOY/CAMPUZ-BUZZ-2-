import { supabase } from "@/integrations/supabase/client";
import { uploadCommunityImage } from "@/integrations/supabase/storage";

/**
 * Create a community post with image and caption
 */
export async function createCommunityPost({
  communityId,
  caption,
  file
}: {
  communityId: string;
  caption?: string;
  file: File;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Upload image using storage helper
  const imageUrl = await uploadCommunityImage(file, communityId);

  // Extract path from URL for deletion later
  const urlObj = new URL(imageUrl);
  const imagePath = urlObj.pathname.split('/').slice(-3).join('/'); // communityId/timestamp-filename

  // Insert post record
  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      community_id: communityId,
      user_id: user.id,
      image_url: imageUrl,
      image_path: imagePath,
      caption: caption ?? null,
      post_type: 'image'
    })
    .select("*")
    .single();

  if (error) {
    console.error("Create post error:", error);
    throw error;
  }

  return data;
}

/**
 * Fetch all posts for a community
 */
export async function getCommunityPosts(communityId: string) {
  const { data, error } = await supabase
    .from('community_posts')
    .select(`
      *,
      profiles:user_id (
        display_name,
        avatar_url,
        username
      )
    `)
    .eq('community_id', communityId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Fetch posts error:", error);
    throw error;
  }

  return data;
}

/**
 * Delete a community post
 */
export async function deleteCommunityPost(postId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get post to check ownership and get image path
  const { data: post, error: fetchError } = await supabase
    .from('community_posts')
    .select('image_path, user_id')
    .eq('id', postId)
    .single();

  if (fetchError || !post) {
    throw new Error("Post not found");
  }

  // Verify ownership
  if (post.user_id !== user.id) {
    throw new Error("Not authorized to delete this post");
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('community_posts')
    .delete()
    .eq('id', postId);

  if (deleteError) {
    console.error("Delete post error:", deleteError);
    throw deleteError;
  }

  // Delete from storage
  if (post.image_path) {
    try {
      await supabase.storage
        .from('community-posts')
        .remove([post.image_path]);
    } catch (storageError) {
      console.warn("Storage cleanup error:", storageError);
      // Don't fail the operation if storage cleanup fails
    }
  }

  return true;
}

/**
 * Add reaction to a post
 */
export async function addReaction(postId: string, reactionType: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get current reactions
  const { data: post } = await supabase
    .from('community_posts')
    .select('reactions')
    .eq('id', postId)
    .single();

  const reactions = (post?.reactions as any) || {};
  const userReactions = reactions[user.id] || [];

  // Toggle reaction
  let newUserReactions;
  if (userReactions.includes(reactionType)) {
    newUserReactions = userReactions.filter((r: string) => r !== reactionType);
  } else {
    newUserReactions = [...userReactions, reactionType];
  }

  reactions[user.id] = newUserReactions;

  // Update post
  const { error } = await supabase
    .from('community_posts')
    .update({ reactions })
    .eq('id', postId);

  if (error) throw error;

  return true;
}

