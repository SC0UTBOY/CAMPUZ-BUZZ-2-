import { supabase } from '@/integrations/supabase/client';

export interface PostData {
  id: string;
  author_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar: string;
  };
  likes: number;
  comments: number;
  is_liked: boolean;
}

export interface CommentData {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar: string;
  };
}

export class PostsService {
  static async getPosts(limit = 20, offset = 0): Promise<PostData[]> {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }

    if (!posts || posts.length === 0) return [];

    // Fetch profiles manually
    const userIds = [...new Set(posts.map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from('user_profiles' as any)
      .select('id, username, display_name, avatar_url')
      .in('id', userIds);

    const profilesMap = new Map(profiles?.map((p: any) => [p.id, p]));

    // Fetch user likes
    let userLikes: string[] = [];
    if (userId) {
      const { data: likes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', posts.map(p => p.id));
      userLikes = likes?.map(l => l.post_id) || [];
    }

    return posts.map(post => {
      const profile = profilesMap.get(post.user_id);
      return {
        id: post.id,
        author_id: post.user_id,
        content: post.content,
        image_url: post.image_url,
        created_at: post.created_at,
        updated_at: post.updated_at || post.created_at,
        author: {
          id: post.user_id,
          username: profile?.username || 'unknown',
          display_name: profile?.display_name || 'Unknown User',
          avatar: profile?.avatar_url || ''
        },
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        is_liked: userLikes.includes(post.id)
      };
    });
  }

  static async toggleLike(postId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    // Check if user already liked this post
    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.data.user.id)
      .maybeSingle();

    if (checkError) throw checkError;

    let isLiked: boolean;

    if (existingLike) {
      // Unlike - remove the like
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.data.user.id);

      if (deleteError) throw deleteError;
      isLiked = false;
    } else {
      // Like - insert new like (unique constraint prevents duplicates)
      const { error: insertError } = await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: user.data.user.id
        });

      // Handle duplicate key error gracefully (means already liked)
      if (insertError && insertError.code !== '23505') {
        throw insertError;
      }
      isLiked = insertError?.code === '23505' ? true : true;
    }

    // Get actual like count from database
    const { count, error: countError } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (countError) throw countError;

    return { isLiked, likeCount: count || 0 };
  }

  static async likePost(postId: string): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('likes')
      .insert({
        user_id: user.data.user.id,
        post_id: postId
      });

    if (error && error.code !== '23505') { // Ignore duplicate key error
      console.error('Error liking post:', error);
      throw error;
    }
  }

  static async unlikePost(postId: string): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.data.user.id)
      .eq('post_id', postId);

    if (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  }

  static async getComments(postId: string): Promise<CommentData[]> {
    const { data, error } = await supabase
      .from('comments' as any)
      .select(`
        id,
        content,
        created_at,
        user_id,
        user_profiles (full_name, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true }) as any;

    if (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }

    if (!data) return [];

    return data.map((comment: any) => ({
      id: comment.id,
      post_id: postId,
      author_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at,
      updated_at: comment.created_at,
      author: {
        id: comment.user_id,
        username: comment.user_profiles?.full_name || 'unknown',
        display_name: comment.user_profiles?.full_name || 'Unknown User',
        avatar: comment.user_profiles?.avatar_url || ''
      }
    }));
  }

  static async addComment(postId: string, content: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not logged in');

    const { error } = await supabase
      .from('comments' as any)
      .insert({
        post_id: postId,
        content,
        user_id: user.id
      })
      .select(`
        *,
        user_profiles(full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  static async deleteComment(commentId: string): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    // Get the comment to find post_id and verify ownership
    const { data: comment, error: fetchError } = await supabase
      .from('comments' as any)
      .select('post_id, user_id')
      .eq('id', commentId)
      .single() as any;

    if (fetchError) {
      console.error('Error fetching comment:', fetchError);
      throw fetchError;
    }

    if (comment.user_id !== user.data.user.id) {
      throw new Error('You can only delete your own comments');
    }

    // Delete the comment
    const { error: deleteError } = await supabase
      .from('comments' as any)
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.data.user.id);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      throw deleteError;
    }

    // The database trigger will automatically update comments_count
    // No manual update needed
  }

  static async getPostsByHashtag(hashtag: string, limit = 20, offset = 0): Promise<PostData[]> {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    // First, get the hashtag ID
    const { data: hashtagData } = await supabase
      .from('hashtags')
      .select('id')
      .eq('name', hashtag.toLowerCase())
      .single();

    if (!hashtagData) return [];

    // Get posts with this hashtag
    const { data: postHashtags, error: postHashtagsError } = await supabase
      .from('post_hashtags')
      .select('post_id')
      .eq('hashtag_id', hashtagData.id);

    if (postHashtagsError || !postHashtags || postHashtags.length === 0) return [];

    const postIds = postHashtags.map(ph => ph.post_id);

    // Fetch the posts
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .in('id', postIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching posts by hashtag:', error);
      throw error;
    }

    if (!posts || posts.length === 0) return [];

    // Fetch profiles manually
    const userIds = [...new Set(posts.map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from('user_profiles' as any)
      .select('id, username, display_name, avatar_url')
      .in('id', userIds);

    const profilesMap = new Map(profiles?.map((p: any) => [p.id, p]));

    // Fetch user likes
    let userLikes: string[] = [];
    if (userId) {
      const { data: likes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', posts.map(p => p.id));
      userLikes = likes?.map(l => l.post_id) || [];
    }

    return posts.map(post => {
      const profile = profilesMap.get(post.user_id);
      return {
        id: post.id,
        author_id: post.user_id,
        content: post.content,
        image_url: post.image_url,
        created_at: post.created_at,
        updated_at: post.updated_at || post.created_at,
        author: {
          id: post.user_id,
          username: profile?.username || 'unknown',
          display_name: profile?.display_name || 'Unknown User',
          avatar: profile?.avatar_url || ''
        },
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        is_liked: userLikes.includes(post.id)
      };
    });
  }

  static async deletePost(postId: string): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    // First check if the user owns the post
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError) {
      console.error('Error fetching post:', fetchError);
      throw fetchError;
    }

    if (!post) {
      throw new Error('Post not found');
    }

    if (post.user_id !== user.data.user.id) {
      throw new Error('You can only delete your own posts');
    }

    // Delete all comments for this post first (CASCADE)
    const { error: deleteCommentsError } = await supabase
      .from('comments')
      .delete()
      .eq('post_id', postId);

    if (deleteCommentsError) {
      console.error('Error deleting comments:', deleteCommentsError);
      // Continue anyway - some databases have CASCADE delete setup
    }

    // Delete all likes for this post
    const { error: deleteLikesError } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId);

    if (deleteLikesError) {
      console.error('Error deleting likes:', deleteLikesError);
      // Continue anyway
    }

    // Delete the post
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.data.user.id);

    if (deleteError) {
      console.error('Error deleting post:', deleteError);
      throw deleteError;
    }
  }

  static async createPhotoPost(photoData: {
    title?: string;
    content: string;
    imageFile: File;
    userId: string;
    communityId?: string;
  }): Promise<PostData> {
    try {
      // Validate file type
      if (!photoData.imageFile.type.startsWith('image/')) {
        throw new Error('Invalid file type. Please select an image file.');
      }

      // Validate file size (max 5MB)
      if (photoData.imageFile.size > 5 * 1024 * 1024) {
        throw new Error('File size exceeds 5MB. Please select a smaller image.');
      }

      // Generate unique filename
      const fileExt = photoData.imageFile.name.split('.').pop() || 'jpg';
      const uuid = crypto.randomUUID();
      const fileName = `${uuid}.${fileExt}`;
      const filePath = `images/${photoData.userId}/${fileName}`;

      // Upload to Supabase Storage bucket "posts"
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, photoData.imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(uploadData.path);

      // Insert into posts table with ONLY valid columns
      const { data: post, error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: photoData.userId,
          community_id: photoData.communityId || null,
          title: photoData.title || null,
          content: photoData.content,
          post_type: 'image',
          image_url: publicUrl,
          file_url: publicUrl,
          file_name: fileName,
          visibility: 'public',
          tags: [],
          reactions: {}
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating post:', insertError);
        throw new Error(`Failed to create post: ${insertError.message}`);
      }

      // Fetch profile for the response
      const { data: profile } = await supabase
        .from('user_profiles' as any)
        .select('id, username, display_name, avatar_url')
        .eq('id', photoData.userId)
        .single() as any;

      // Transform to PostData format
      return {
        id: post.id,
        author_id: post.user_id,
        content: post.content,
        image_url: post.image_url,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author: {
          id: post.user_id,
          username: profile?.username || 'unknown',
          display_name: profile?.display_name || 'Unknown User',
          avatar: profile?.avatar_url || ''
        },
        likes: 0,
        comments: 0,
        is_liked: false
      };
    } catch (error) {
      console.error('Error in createPhotoPost:', error);
      throw error;
    }
  }
}