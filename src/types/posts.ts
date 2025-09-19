
export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string;
  major?: string;
  year?: string;
}

export interface PostReaction {
  count: number;
  users: string[];
  hasReacted?: boolean;
}

export interface PostReactions {
  [reactionType: string]: PostReaction;
}

// Updated Post interface to match actual database schema
export interface Post {
  id: string;
  user_id: string;
  title?: string;
  content: string;
  image_url?: string;
  post_type: 'text' | 'image' | 'video' | 'poll';
  tags?: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  created_at: string;
  updated_at: string;
  visibility: 'public' | 'friends' | 'private';
  hashtags?: string[];
  location?: string;
  mentions?: string[];
  reactions: PostReactions;
  profiles?: Profile | Profile[];
  // Additional fields that may come from database
  community_id?: string;
  file_name?: string;
  file_url?: string;
  is_pinned?: boolean;
  // User interaction fields
  is_liked?: boolean;
  is_saved?: boolean;
  user_reaction?: string;
  author?: Profile;
}

export interface EnhancedPostData extends Post {
  author: Profile;
  is_liked: boolean;
  is_saved: boolean;
  user_reaction?: string;
}

export interface PostFilter {
  type?: 'text' | 'image' | 'video' | 'poll';
  tags?: string[];
  hashtags?: string[];
  author?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'recent' | 'popular' | 'trending';
  visibility?: 'public' | 'friends' | 'all';
}

export interface PostCreationData {
  content: string;
  title?: string;
  post_type: 'text' | 'image' | 'video' | 'poll';
  images?: File[];
  tags?: string[];
  mentions?: string[];
  location?: string;
  visibility: 'public' | 'friends' | 'private';
  poll_options?: string[];
}

export interface UserPostInteractions {
  is_liked: boolean;
  is_saved: boolean;
  reaction_type?: string;
}

export interface Hashtag {
  id: string;
  name: string;
  usage_count: number;
  created_at: string;
}

// Raw database post type for transformations - matches Supabase response
export interface DatabasePost {
  id: string;
  user_id: string;
  title?: string;
  content: string;
  image_url?: string;
  post_type: string;
  tags?: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  created_at: string;
  updated_at: string;
  visibility: string;
  hashtags?: string[];
  mentions?: string[];
  community_id?: string;
  file_name?: string;
  file_url?: string;
  is_pinned?: boolean;
  reactions?: any; // JSON from database
  profiles?: any;
}
