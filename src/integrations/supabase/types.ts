export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      automated_moderation_rules: {
        Row: {
          action: string
          created_at: string | null
          created_by: string
          id: string
          is_active: boolean | null
          name: string
          pattern: string
          rule_type: string
          severity: number | null
          updated_at: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          created_by: string
          id?: string
          is_active?: boolean | null
          name: string
          pattern: string
          rule_type: string
          severity?: number | null
          updated_at?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          name?: string
          pattern?: string
          rule_type?: string
          severity?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          edited_at: string | null
          id: string
          message_type: string | null
          reply_to: string | null
          room_id: string | null
          user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          message_type?: string | null
          reply_to?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          message_type?: string | null
          reply_to?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          id: string
          joined_at: string | null
          last_read_at: string | null
          role: string | null
          room_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_private: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          depth: number | null
          id: string
          likes_count: number | null
          parent_id: string | null
          post_id: string
          reactions: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          depth?: number | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id: string
          reactions?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          depth?: number | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string
          reactions?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_private: boolean | null
          member_count: number | null
          name: string
          search_vector: unknown | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name: string
          search_vector?: unknown | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name?: string
          search_vector?: unknown | null
          updated_at?: string
        }
        Relationships: []
      }
      communities_enhanced: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          invite_code: string | null
          is_private: boolean | null
          member_count: number | null
          name: string
          rules: string | null
          slow_mode_seconds: number | null
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          invite_code?: string | null
          is_private?: boolean | null
          member_count?: number | null
          name: string
          rules?: string | null
          slow_mode_seconds?: number | null
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          is_private?: boolean | null
          member_count?: number | null
          name?: string
          rules?: string | null
          slow_mode_seconds?: number | null
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      community_announcements: {
        Row: {
          author_id: string
          community_id: string
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          priority: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          community_id: string
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          community_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_announcements_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_enhanced"
            referencedColumns: ["id"]
          },
        ]
      }
      community_channels: {
        Row: {
          community_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_private: boolean | null
          name: string
          position: number | null
          slowmode_seconds: number | null
          topic: string | null
          type: string
          updated_at: string
        }
        Insert: {
          community_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          name: string
          position?: number | null
          slowmode_seconds?: number | null
          topic?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          position?: number | null
          slowmode_seconds?: number | null
          topic?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_channels_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_enhanced"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          banned: boolean | null
          community_id: string
          id: string
          joined_at: string
          muted_until: string | null
          nickname: string | null
          roles: string[] | null
          user_id: string
        }
        Insert: {
          banned?: boolean | null
          community_id: string
          id?: string
          joined_at?: string
          muted_until?: string | null
          nickname?: string | null
          roles?: string[] | null
          user_id: string
        }
        Update: {
          banned?: boolean | null
          community_id?: string
          id?: string
          joined_at?: string
          muted_until?: string | null
          nickname?: string | null
          roles?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_enhanced"
            referencedColumns: ["id"]
          },
        ]
      }
      community_memberships: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      community_reports: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          evidence_urls: string[] | null
          id: string
          reason: string
          reported_by: string
          reported_community_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          status: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason: string
          reported_by: string
          reported_community_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason?: string
          reported_by?: string
          reported_community_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
        }
        Relationships: []
      }
      community_roles: {
        Row: {
          can_create_posts: boolean | null
          can_invite_members: boolean | null
          can_manage_events: boolean | null
          can_moderate: boolean | null
          color: string | null
          community_id: string
          created_at: string
          id: string
          mentionable: boolean | null
          name: string
          permissions: Json | null
          position: number | null
        }
        Insert: {
          can_create_posts?: boolean | null
          can_invite_members?: boolean | null
          can_manage_events?: boolean | null
          can_moderate?: boolean | null
          color?: string | null
          community_id: string
          created_at?: string
          id?: string
          mentionable?: boolean | null
          name: string
          permissions?: Json | null
          position?: number | null
        }
        Update: {
          can_create_posts?: boolean | null
          can_invite_members?: boolean | null
          can_manage_events?: boolean | null
          can_moderate?: boolean | null
          color?: string | null
          community_id?: string
          created_at?: string
          id?: string
          mentionable?: boolean | null
          name?: string
          permissions?: Json | null
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_roles_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_enhanced"
            referencedColumns: ["id"]
          },
        ]
      }
      compromised_passwords: {
        Row: {
          id: string
          password_hash: string
          reported_at: string | null
          source: string | null
        }
        Insert: {
          id?: string
          password_hash: string
          reported_at?: string | null
          source?: string | null
        }
        Update: {
          id?: string
          password_hash?: string
          reported_at?: string | null
          source?: string | null
        }
        Relationships: []
      }
      content_flags: {
        Row: {
          auto_actioned: boolean | null
          confidence_score: number | null
          content_id: string
          content_type: string
          created_at: string | null
          flag_type: string
          id: string
          reviewed: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          rule_id: string | null
        }
        Insert: {
          auto_actioned?: boolean | null
          confidence_score?: number | null
          content_id: string
          content_type: string
          created_at?: string | null
          flag_type: string
          id?: string
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rule_id?: string | null
        }
        Update: {
          auto_actioned?: boolean | null
          confidence_score?: number | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          flag_type?: string
          id?: string
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_flags_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automated_moderation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_emojis: {
        Row: {
          community_id: string
          created_at: string
          created_by: string
          id: string
          image_url: string
          name: string
        }
        Insert: {
          community_id: string
          created_at?: string
          created_by: string
          id?: string
          image_url: string
          name: string
        }
        Update: {
          community_id?: string
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_emojis_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_enhanced"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_group: boolean | null
          name: string | null
          participants: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          name?: string | null
          participants: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          name?: string | null
          participants?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      event_notifications: {
        Row: {
          created_at: string
          event_id: string
          id: string
          notification_type: string
          scheduled_for: string
          sent_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          notification_type: string
          scheduled_for: string
          sent_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          notification_type?: string
          scheduled_for?: string
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      events: {
        Row: {
          attendee_count: number | null
          community_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          end_time: string
          event_type: string | null
          google_calendar_id: string | null
          id: string
          is_public: boolean | null
          is_virtual: boolean | null
          location: string | null
          max_attendees: number | null
          meeting_link: string | null
          outlook_calendar_id: string | null
          search_vector: unknown | null
          start_time: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          attendee_count?: number | null
          community_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_time: string
          event_type?: string | null
          google_calendar_id?: string | null
          id?: string
          is_public?: boolean | null
          is_virtual?: boolean | null
          location?: string | null
          max_attendees?: number | null
          meeting_link?: string | null
          outlook_calendar_id?: string | null
          search_vector?: unknown | null
          start_time: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          attendee_count?: number | null
          community_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_time?: string
          event_type?: string | null
          google_calendar_id?: string | null
          id?: string
          is_public?: boolean | null
          is_virtual?: boolean | null
          location?: string | null
          max_attendees?: number | null
          meeting_link?: string | null
          outlook_calendar_id?: string | null
          search_vector?: unknown | null
          start_time?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_enhanced"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mentorship_matches: {
        Row: {
          created_at: string
          id: string
          match_score: number | null
          mentee_id: string
          mentor_id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          match_score?: number | null
          mentee_id: string
          mentor_id: string
          status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          match_score?: number | null
          mentee_id?: string
          mentor_id?: string
          status?: string | null
        }
        Relationships: []
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          channel_id: string | null
          content: string
          created_at: string
          dm_conversation_id: string | null
          edited_at: string | null
          embeds: Json | null
          id: string
          is_edited: boolean | null
          is_pinned: boolean | null
          mentions: string[] | null
          message_type: string | null
          reactions: Json | null
          reply_to: string | null
          thread_root: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          channel_id?: string | null
          content: string
          created_at?: string
          dm_conversation_id?: string | null
          edited_at?: string | null
          embeds?: Json | null
          id?: string
          is_edited?: boolean | null
          is_pinned?: boolean | null
          mentions?: string[] | null
          message_type?: string | null
          reactions?: Json | null
          reply_to?: string | null
          thread_root?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          channel_id?: string | null
          content?: string
          created_at?: string
          dm_conversation_id?: string | null
          edited_at?: string | null
          embeds?: Json | null
          id?: string
          is_edited?: boolean | null
          is_pinned?: boolean | null
          mentions?: string[] | null
          message_type?: string | null
          reactions?: Json | null
          reply_to?: string | null
          thread_root?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "community_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_root_fkey"
            columns: ["thread_root"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action_type: string
          created_at: string | null
          duration: unknown | null
          expires_at: string | null
          id: string
          moderator_id: string
          notes: string | null
          reason: string
          reversal_reason: string | null
          reversed_at: string | null
          reversed_by: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          duration?: unknown | null
          expires_at?: string | null
          id?: string
          moderator_id: string
          notes?: string | null
          reason: string
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          duration?: unknown | null
          expires_at?: string | null
          id?: string
          moderator_id?: string
          notes?: string | null
          reason?: string
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      moderation_logs: {
        Row: {
          action: string
          community_id: string
          created_at: string
          duration: number | null
          id: string
          metadata: Json | null
          moderator_id: string
          reason: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          community_id: string
          created_at?: string
          duration?: number | null
          id?: string
          metadata?: Json | null
          moderator_id: string
          reason?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          community_id?: string
          created_at?: string
          duration?: number | null
          id?: string
          metadata?: Json | null
          moderator_id?: string
          reason?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_enhanced"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pinned_messages: {
        Row: {
          channel_id: string | null
          dm_conversation_id: string | null
          id: string
          message_id: string
          pinned_at: string
          pinned_by: string
        }
        Insert: {
          channel_id?: string | null
          dm_conversation_id?: string | null
          id?: string
          message_id: string
          pinned_at?: string
          pinned_by: string
        }
        Update: {
          channel_id?: string | null
          dm_conversation_id?: string | null
          id?: string
          message_id?: string
          pinned_at?: string
          pinned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "community_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_messages_dm_conversation_id_fkey"
            columns: ["dm_conversation_id"]
            isOneToOne: false
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      post_hashtags: {
        Row: {
          hashtag_id: string
          id: string
          post_id: string
        }
        Insert: {
          hashtag_id: string
          id?: string
          post_id: string
        }
        Update: {
          hashtag_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_mentions: {
        Row: {
          created_at: string | null
          id: string
          mentioned_user_id: string
          post_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentioned_user_id: string
          post_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mentioned_user_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reports: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          evidence_urls: string[] | null
          id: string
          post_id: string
          reason: string
          reported_by: string
          severity: string | null
          status: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          post_id: string
          reason: string
          reported_by: string
          severity?: string | null
          status?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          post_id?: string
          reason?: string
          reported_by?: string
          severity?: string | null
          status?: string | null
        }
        Relationships: []
      }
      post_saves: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          community_id: string | null
          content: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          image_url: string | null
          is_pinned: boolean | null
          likes_count: number | null
          poll_options: Json | null
          post_type: string | null
          reactions: Json | null
          saves_count: number | null
          search_vector: unknown | null
          shares_count: number | null
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
          visibility: string | null
        }
        Insert: {
          comments_count?: number | null
          community_id?: string | null
          content: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          likes_count?: number | null
          poll_options?: Json | null
          post_type?: string | null
          reactions?: Json | null
          saves_count?: number | null
          search_vector?: unknown | null
          shares_count?: number | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
          visibility?: string | null
        }
        Update: {
          comments_count?: number | null
          community_id?: string | null
          content?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          likes_count?: number | null
          poll_options?: Json | null
          post_type?: string | null
          reactions?: Json | null
          saves_count?: number | null
          search_vector?: unknown | null
          shares_count?: number | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          department: string | null
          display_name: string | null
          engagement_score: number | null
          gpa: number | null
          graduation_year: number | null
          id: string
          interests: string[] | null
          major: string | null
          privacy_settings: Json | null
          role: string | null
          school: string | null
          search_vector: unknown | null
          skills: string[] | null
          social_links: Json | null
          updated_at: string
          user_id: string
          year: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          engagement_score?: number | null
          gpa?: number | null
          graduation_year?: number | null
          id?: string
          interests?: string[] | null
          major?: string | null
          privacy_settings?: Json | null
          role?: string | null
          school?: string | null
          search_vector?: unknown | null
          skills?: string[] | null
          social_links?: Json | null
          updated_at?: string
          user_id: string
          year?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          engagement_score?: number | null
          gpa?: number | null
          graduation_year?: number | null
          id?: string
          interests?: string[] | null
          major?: string | null
          privacy_settings?: Json | null
          role?: string | null
          school?: string | null
          search_vector?: unknown | null
          skills?: string[] | null
          social_links?: Json | null
          updated_at?: string
          user_id?: string
          year?: string | null
        }
        Relationships: []
      }
      push_notification_tokens: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_used: string | null
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          platform: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          attempts: number | null
          blocked_until: string | null
          created_at: string | null
          id: string
          identifier: string
          window_start: string | null
        }
        Insert: {
          action_type: string
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier: string
          window_start?: string | null
        }
        Update: {
          action_type?: string
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier?: string
          window_start?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      session_participants: {
        Row: {
          created_at: string
          id: string
          joined_at: string | null
          left_at: string | null
          session_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          session_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          session_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "study_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      study_group_analytics: {
        Row: {
          id: string
          metric_type: string
          metric_value: Json
          period_end: string | null
          period_start: string | null
          recorded_at: string
          study_group_id: string
        }
        Insert: {
          id?: string
          metric_type: string
          metric_value?: Json
          period_end?: string | null
          period_start?: string | null
          recorded_at?: string
          study_group_id: string
        }
        Update: {
          id?: string
          metric_type?: string
          metric_value?: Json
          period_end?: string | null
          period_start?: string | null
          recorded_at?: string
          study_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_analytics_study_group_id_fkey"
            columns: ["study_group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_members: {
        Row: {
          id: string
          joined_at: string
          role: string | null
          study_group_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string | null
          study_group_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string | null
          study_group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_study_group_id_fkey"
            columns: ["study_group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_private: boolean | null
          location: string | null
          max_members: number | null
          meeting_schedule: Json | null
          name: string
          subject: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          location?: string | null
          max_members?: number | null
          meeting_schedule?: Json | null
          name: string
          subject: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          location?: string | null
          max_members?: number | null
          meeting_schedule?: Json | null
          name?: string
          subject?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          created_at: string
          description: string | null
          download_count: number | null
          file_size: number
          file_type: string
          file_url: string
          id: string
          is_public: boolean | null
          study_group_id: string
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          download_count?: number | null
          file_size: number
          file_type: string
          file_url: string
          id?: string
          is_public?: boolean | null
          study_group_id: string
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          download_count?: number | null
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          is_public?: boolean | null
          study_group_id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_study_group_id_fkey"
            columns: ["study_group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_virtual: boolean | null
          location: string | null
          max_participants: number | null
          meeting_link: string | null
          scheduled_at: string
          study_group_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          max_participants?: number | null
          meeting_link?: string | null
          scheduled_at: string
          study_group_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          max_participants?: number | null
          meeting_link?: string | null
          scheduled_at?: string
          study_group_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_study_group_id_fkey"
            columns: ["study_group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      trending_topics: {
        Row: {
          created_at: string | null
          id: string
          last_mentioned: string | null
          mention_count: number | null
          topic: string
          trend_score: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_mentioned?: string | null
          mention_count?: number | null
          topic: string
          trend_score?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_mentioned?: string | null
          mention_count?: number | null
          topic?: string
          trend_score?: number | null
        }
        Relationships: []
      }
      typing_indicators: {
        Row: {
          channel_id: string | null
          dm_conversation_id: string | null
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          channel_id?: string | null
          dm_conversation_id?: string | null
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string | null
          dm_conversation_id?: string | null
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "community_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_indicators_dm_conversation_id_fkey"
            columns: ["dm_conversation_id"]
            isOneToOne: false
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_status: {
        Row: {
          id: string
          room_id: string | null
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          room_id?: string | null
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          room_id?: string | null
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "typing_status_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_data: Json | null
          achievement_type: string
          earned_at: string | null
          id: string
          is_visible: boolean | null
          user_id: string
        }
        Insert: {
          achievement_data?: Json | null
          achievement_type: string
          earned_at?: string | null
          id?: string
          is_visible?: boolean | null
          user_id: string
        }
        Update: {
          achievement_data?: Json | null
          achievement_type?: string
          earned_at?: string | null
          id?: string
          is_visible?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_analytics: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_at: string
          blocked_id: string
          blocker_id: string
          id: string
        }
        Insert: {
          blocked_at?: string
          blocked_id: string
          blocker_id: string
          id?: string
        }
        Update: {
          blocked_at?: string
          blocked_id?: string
          blocker_id?: string
          id?: string
        }
        Relationships: []
      }
      user_bookmarks: {
        Row: {
          bookmarked_at: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          bookmarked_at?: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          bookmarked_at?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bookmarks_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          evidence_urls: string[] | null
          id: string
          reason: string
          reported_by: string
          reported_user_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          status: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason: string
          reported_by: string
          reported_user_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason?: string
          reported_by?: string
          reported_user_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
        }
        Relationships: []
      }
      user_security_settings: {
        Row: {
          account_locked_until: string | null
          created_at: string
          failed_login_attempts: number | null
          id: string
          password_changed_at: string | null
          security_questions_set: boolean | null
          two_factor_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_locked_until?: string | null
          created_at?: string
          failed_login_attempts?: number | null
          id?: string
          password_changed_at?: string | null
          security_questions_set?: boolean | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_locked_until?: string | null
          created_at?: string
          failed_login_attempts?: number | null
          id?: string
          password_changed_at?: string | null
          security_questions_set?: boolean | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      voice_sessions: {
        Row: {
          channel_id: string
          ended_at: string | null
          id: string
          is_active: boolean | null
          participants: string[] | null
          session_id: string
          started_at: string
          started_by: string
        }
        Insert: {
          channel_id: string
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          participants?: string[] | null
          session_id: string
          started_at?: string
          started_by: string
        }
        Update: {
          channel_id?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          participants?: string[] | null
          session_id?: string
          started_at?: string
          started_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_sessions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "community_channels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_moderate_community: {
        Args: { community_uuid: string; user_uuid: string }
        Returns: boolean
      }
      can_view_academic_info: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      can_view_profile: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      cleanup_old_typing_indicators: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_post_cascade: {
        Args: { post_uuid: string }
        Returns: boolean
      }
      extract_hashtags: {
        Args: { content: string }
        Returns: string[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_public_profile_info: {
        Args: { target_user_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
        }[]
      }
      get_study_suggestions: {
        Args: { user_uuid: string }
        Returns: {
          description: string
          relevance_score: number
          suggestion_type: string
          title: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_engagement_score: {
        Args: { points?: number; user_uuid: string }
        Returns: undefined
      }
      is_community_member: {
        Args: { community_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_study_group_member: {
        Args: { group_uuid: string; user_uuid: string }
        Returns: boolean
      }
      log_failed_login_attempt: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
