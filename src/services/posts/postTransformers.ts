
import { DatabasePost, Profile, PostReactions, EnhancedPostData } from '@/types/posts';

// Utility function to safely convert JSON to PostReactions
export const safeParseReactions = (reactions: any): PostReactions => {
  if (!reactions || typeof reactions !== 'object' || Array.isArray(reactions)) {
    return {};
  }
  
  const result: PostReactions = {};
  for (const [key, value] of Object.entries(reactions)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const reaction = value as any;
      result[key] = {
        count: typeof reaction.count === 'number' ? reaction.count : 0,
        users: Array.isArray(reaction.users) ? reaction.users : [],
        hasReacted: typeof reaction.hasReacted === 'boolean' ? reaction.hasReacted : false,
      };
    }
  }
  return result;
};

// Utility function to transform database post to client post
export const transformDatabasePostToPost = (post: DatabasePost, profile: Profile | undefined): EnhancedPostData => {
  // Safely parse reactions from database JSON
  const reactions = safeParseReactions(post.reactions);

  return {
    ...post,
    post_type: (post.post_type as 'text' | 'image' | 'video' | 'poll') || 'text',
    visibility: (post.visibility as 'public' | 'friends' | 'private') || 'public',
    hashtags: post.hashtags || [],
    mentions: post.mentions || [],
    reactions,
    author: {
      id: post.user_id,
      display_name: profile?.display_name || 'Anonymous',
      avatar_url: profile?.avatar_url,
      major: profile?.major,
      year: profile?.year,
    },
    is_liked: false,
    is_saved: false,
    user_reaction: undefined,
    likes_count: post.likes_count || 0,
    comments_count: post.comments_count || 0,
    shares_count: post.shares_count || 0,
    saves_count: post.saves_count || 0,
  };
};
