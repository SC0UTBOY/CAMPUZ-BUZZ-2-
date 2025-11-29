import { supabase } from "@/integrations/supabase/client";

/**
 * Join a community
 * @param communityId - The UUID of the community to join
 * @returns Promise with success status
 */
export async function joinCommunity(communityId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: new Error("User not authenticated") };
  }

  const { data, error } = await supabase
    .from("community_members")
    .insert([
      {
        community_id: communityId,
        user_id: user.id,
        joined_at: new Date().toISOString(),
        roles: [],
        banned: false,
      },
    ])
    .select();

  if (error) {
    // If already a member (unique constraint violation), treat as success
    if (error.code === "23505") {
      return { data: "already_member", success: true };
    }
    return { success: false, error };
  }

  return { data, success: true };
}

/**
 * Leave a community
 * @param communityId - The UUID of the community to leave
 * @returns Promise with success status
 */
export async function leaveCommunity(communityId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: new Error("User not authenticated") };
  }

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", user.id);

  if (error) return { success: false, error };

  return { data: "left", success: true };
}

/**
 * Fetch posts for a specific community with author information
 * @param communityId - The UUID of the community
 * @returns Promise with posts data including author profiles
 */
export async function fetchCommunityPosts(communityId: string) {
  try {
    // 1. Fetch posts without join
    const { data: postsData, error: postsError } = await supabase
      .from("community_posts")
      .select("*")
      .eq("community_id", communityId)
      .order("created_at", { ascending: false });

    if (postsError) throw postsError;
    if (!postsData || postsData.length === 0) {
      return { success: true, data: [] };
    }

    // 2. Fetch profiles for all unique user_ids
    const userIds = [...new Set(postsData.map((p) => p.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .in("id", userIds);

    // Create a map of profiles
    const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);

    // 3. For users not in profiles view, try to get from auth metadata
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    for (const userId of userIds) {
      if (!profilesMap.has(userId) || !profilesMap.get(userId)?.display_name) {
        // If this is the current user, get from auth metadata
        if (currentUser && currentUser.id === userId) {
          profilesMap.set(userId, {
            id: currentUser.id,
            display_name: currentUser.user_metadata?.display_name ||
              currentUser.user_metadata?.full_name ||
              currentUser.email?.split('@')[0] ||
              'User',
            username: currentUser.user_metadata?.username || currentUser.email?.split('@')[0],
            avatar_url: currentUser.user_metadata?.avatar_url
          });
        }
      }
    }

    // 4. Combine posts with profile data
    const postsWithProfiles = postsData.map((post) => {
      const profile = profilesMap.get(post.user_id);
      return {
        ...post,
        profiles: profile || {
          display_name: 'Unknown User',
          username: 'user',
          avatar_url: null
        }
      };
    });

    return { success: true, data: postsWithProfiles };
  } catch (error) {
    console.error("Error fetching community posts:", error);
    return { success: false, error };
  }
}

/**
 * Create a new community post
 * @param postData - Object containing user_id, community_id, caption, image_url, image_path
 * @returns Promise with created post data including author profile
 */
export async function createCommunityPost({
  user_id,
  community_id,
  caption,
  image_url,
  image_path
}: {
  user_id: string;
  community_id: string;
  caption: string | null;
  image_url: string | null;
  image_path: string | null;
}) {
  try {
    // Ensure user has display_name in metadata
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (currentUser && currentUser.id === user_id) {
      const displayName = currentUser.user_metadata?.display_name ||
        currentUser.user_metadata?.full_name ||
        currentUser.email?.split('@')[0];

      // If no display name in metadata, update it
      if (!currentUser.user_metadata?.display_name && displayName) {
        await supabase.auth.updateUser({
          data: {
            display_name: displayName
          }
        });
      }
    }

    // Insert the post
    const { data, error } = await supabase
      .from("community_posts")
      .insert([{ user_id, community_id, caption, image_url, image_path }])
      .select()
      .single();

    if (error) throw error;

    // Fetch the author's profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .eq("id", user_id)
      .single();

    // If profile not found in view, use auth metadata
    let profile = profileData;
    if (!profile && currentUser && currentUser.id === user_id) {
      profile = {
        id: currentUser.id,
        display_name: currentUser.user_metadata?.display_name ||
          currentUser.user_metadata?.full_name ||
          currentUser.email?.split('@')[0] ||
          'User',
        username: currentUser.user_metadata?.username || currentUser.email?.split('@')[0],
        avatar_url: currentUser.user_metadata?.avatar_url
      };
    }

    // Return post with profile data
    return {
      success: true,
      data: {
        ...data,
        profiles: profile || {
          display_name: 'User',
          username: 'user',
          avatar_url: null
        }
      }
    };
  } catch (error) {
    console.error("Error creating community post:", error);
    return { success: false, error };
  }
}

/**
 * Delete a community post
 * @param postId - The UUID of the post to delete
 * @returns Promise with success status
 */
export async function deleteCommunityPost(postId: string) {
  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", postId);

  if (error) return { success: false, error };
  return { success: true };
}

/**
 * Check if user is a member of a community
 * @param communityId - The UUID of the community
 * @returns Promise<boolean> - Returns true if user is a member
 */
export async function isCommunityMember(communityId: string): Promise<boolean> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return false;
  }

  const { data, error } = await supabase
    .from("community_members")
    .select("id")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error('Membership check error:', error);
    return false;
  }

  return !!data;
}
