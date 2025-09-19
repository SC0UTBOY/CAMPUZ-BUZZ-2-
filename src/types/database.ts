// Database Types for CampuzBuzz
// Generated from Supabase schema

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          major: string | null
          department: string | null
          year: string | null
          role: string
          engagement_score: number
          created_at: string
          updated_at: string
          school: string | null
          gpa: number | null
          graduation_year: number | null
          skills: string[]
          interests: string[]
          social_links: Json
          privacy_settings: Json
          search_vector: unknown | null
          username: string | null
          avatar: string | null
        }
        Insert: {
          id?: string
          user_id: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          major?: string | null
          department?: string | null
          year?: string | null
          role?: string
          engagement_score?: number
          created_at?: string
          updated_at?: string
          school?: string | null
          gpa?: number | null
          graduation_year?: number | null
          skills?: string[]
          interests?: string[]
          social_links?: Json
          privacy_settings?: Json
          search_vector?: unknown | null
          username?: string | null
          avatar?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          major?: string | null
          department?: string | null
          year?: string | null
          role?: string
          engagement_score?: number
          created_at?: string
          updated_at?: string
          school?: string | null
          gpa?: number | null
          graduation_year?: number | null
          skills?: string[]
          interests?: string[]
          social_links?: Json
          privacy_settings?: Json
          search_vector?: unknown | null
          username?: string | null
          avatar?: string | null
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          community_id: string | null
          title: string | null
          content: string
          post_type: string
          poll_options: Json | null
          tags: string[]
          image_url: string | null
          file_url: string | null
          file_name: string | null
          likes_count: number
          comments_count: number
          is_pinned: boolean
          created_at: string
          updated_at: string
          reactions: Json
          shares_count: number
          saves_count: number
          visibility: string
          search_vector: unknown | null
          hashtags: string[]
          mentions: string[]
        }
        Insert: {
          id?: string
          user_id: string
          community_id?: string | null
          title?: string | null
          content: string
          post_type?: string
          poll_options?: Json | null
          tags?: string[]
          image_url?: string | null
          file_url?: string | null
          file_name?: string | null
          likes_count?: number
          comments_count?: number
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
          reactions?: Json
          shares_count?: number
          saves_count?: number
          visibility?: string
          search_vector?: unknown | null
          hashtags?: string[]
          mentions?: string[]
        }
        Update: {
          id?: string
          user_id?: string
          community_id?: string | null
          title?: string | null
          content?: string
          post_type?: string
          poll_options?: Json | null
          tags?: string[]
          image_url?: string | null
          file_url?: string | null
          file_name?: string | null
          likes_count?: number
          comments_count?: number
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
          reactions?: Json
          shares_count?: number
          saves_count?: number
          visibility?: string
          search_vector?: unknown | null
          hashtags?: string[]
          mentions?: string[]
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          likes_count: number
          created_at: string
          parent_id: string | null
          reactions: Json
          depth: number
          updated_at: string | null
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          likes_count?: number
          created_at?: string
          parent_id?: string | null
          reactions?: Json
          depth?: number
          updated_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          likes_count?: number
          created_at?: string
          parent_id?: string | null
          reactions?: Json
          depth?: number
          updated_at?: string | null
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          post_id: string | null
          comment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id?: string | null
          comment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string | null
          comment_id?: string | null
          created_at?: string
        }
      }
      communities_enhanced: {
        Row: {
          id: string
          name: string
          description: string | null
          avatar_url: string | null
          banner_url: string | null
          invite_code: string | null
          is_private: boolean
          member_count: number
          welcome_message: string | null
          rules: string | null
          slow_mode_seconds: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          invite_code?: string | null
          is_private?: boolean
          member_count?: number
          welcome_message?: string | null
          rules?: string | null
          slow_mode_seconds?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          invite_code?: string | null
          is_private?: boolean
          member_count?: number
          welcome_message?: string | null
          rules?: string | null
          slow_mode_seconds?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      study_groups: {
        Row: {
          id: string
          name: string
          description: string | null
          subject: string
          is_private: boolean
          max_members: number
          created_by: string
          created_at: string
          updated_at: string
          tags: string[]
          location: string | null
          meeting_schedule: Json | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          subject: string
          is_private?: boolean
          max_members?: number
          created_by: string
          created_at?: string
          updated_at?: string
          tags?: string[]
          location?: string | null
          meeting_schedule?: Json | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          subject?: string
          is_private?: boolean
          max_members?: number
          created_by?: string
          created_at?: string
          updated_at?: string
          tags?: string[]
          location?: string | null
          meeting_schedule?: Json | null
        }
      }
      events: {
        Row: {
          id: string
          community_id: string | null
          created_by: string
          title: string
          description: string | null
          event_type: string
          start_time: string
          end_time: string
          location: string | null
          is_virtual: boolean
          meeting_link: string | null
          max_attendees: number | null
          is_public: boolean
          tags: string[]
          created_at: string | null
          updated_at: string | null
          attendee_count: number
          google_calendar_id: string | null
          outlook_calendar_id: string | null
          search_vector: unknown | null
        }
        Insert: {
          id?: string
          community_id?: string | null
          created_by: string
          title: string
          description?: string | null
          event_type?: string
          start_time: string
          end_time: string
          location?: string | null
          is_virtual?: boolean
          meeting_link?: string | null
          max_attendees?: number | null
          is_public?: boolean
          tags?: string[]
          created_at?: string | null
          updated_at?: string | null
          attendee_count?: number
          google_calendar_id?: string | null
          outlook_calendar_id?: string | null
          search_vector?: unknown | null
        }
        Update: {
          id?: string
          community_id?: string | null
          created_by?: string
          title?: string
          description?: string | null
          event_type?: string
          start_time?: string
          end_time?: string
          location?: string | null
          is_virtual?: boolean
          meeting_link?: string | null
          max_attendees?: number | null
          is_public?: boolean
          tags?: string[]
          created_at?: string | null
          updated_at?: string | null
          attendee_count?: number
          google_calendar_id?: string | null
          outlook_calendar_id?: string | null
          search_vector?: unknown | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          data: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message?: string | null
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string | null
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      popular_posts: {
        Row: {
          id: string | null
          title: string | null
          content: string | null
          created_at: string | null
          likes_count: number | null
          comments_count: number | null
          shares_count: number | null
          popularity_score: number | null
        }
      }
    }
    Functions: {
      search_all: {
        Args: {
          search_query: string
          search_type?: string
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          result_type: string
          result_id: string
          title: string
          content: string
          created_at: string
          rank: number
        }[]
      }
      get_trending_hashtags: {
        Args: {
          limit_count?: number
          time_window?: string
        }
        Returns: {
          hashtag_name: string
          usage_count: number
          recent_usage: number
        }[]
      }
      get_user_feed: {
        Args: {
          user_id_param: string
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          post_id: string
          title: string
          content: string
          post_type: string
          image_url: string
          created_at: string
          user_id: string
          display_name: string
          avatar_url: string
          likes_count: number
          comments_count: number
          is_liked: boolean
        }[]
      }
    }
  }
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Helper types for common operations
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Post = Database['public']['Tables']['posts']['Row']
export type PostInsert = Database['public']['Tables']['posts']['Insert']
export type PostUpdate = Database['public']['Tables']['posts']['Update']

export type Comment = Database['public']['Tables']['comments']['Row']
export type CommentInsert = Database['public']['Tables']['comments']['Insert']
export type CommentUpdate = Database['public']['Tables']['comments']['Update']

export type Like = Database['public']['Tables']['likes']['Row']
export type LikeInsert = Database['public']['Tables']['likes']['Insert']

export type Community = Database['public']['Tables']['communities_enhanced']['Row']
export type CommunityInsert = Database['public']['Tables']['communities_enhanced']['Insert']
export type CommunityUpdate = Database['public']['Tables']['communities_enhanced']['Update']

export type StudyGroup = Database['public']['Tables']['study_groups']['Row']
export type StudyGroupInsert = Database['public']['Tables']['study_groups']['Insert']
export type StudyGroupUpdate = Database['public']['Tables']['study_groups']['Update']

export type Event = Database['public']['Tables']['events']['Row']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type EventUpdate = Database['public']['Tables']['events']['Update']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

// Extended types with relationships
export type PostWithProfile = Post & {
  profiles: Pick<Profile, 'display_name' | 'avatar_url' | 'username'>
}

export type CommentWithProfile = Comment & {
  profiles: Pick<Profile, 'display_name' | 'avatar_url' | 'username'>
  replies?: CommentWithProfile[]
}

export type PostWithDetails = PostWithProfile & {
  comments?: CommentWithProfile[]
  is_liked?: boolean
  is_saved?: boolean
}

export type CommunityWithMembership = Community & {
  is_member?: boolean
  member_role?: string
}

export type EventWithRSVP = Event & {
  user_rsvp_status?: 'going' | 'maybe' | 'not_going' | null
}

// Search result types
export type SearchResult = {
  result_type: 'profile' | 'post' | 'event' | 'community'
  result_id: string
  title: string
  content: string
  created_at: string
  rank: number
}

export type TrendingHashtag = {
  hashtag_name: string
  usage_count: number
  recent_usage: number
}

export type UserFeedItem = {
  post_id: string
  title: string
  content: string
  post_type: string
  image_url: string
  created_at: string
  user_id: string
  display_name: string
  avatar_url: string
  likes_count: number
  comments_count: number
  is_liked: boolean
}
