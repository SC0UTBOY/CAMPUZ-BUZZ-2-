
-- Add missing foreign key constraints to properly connect tables

-- Posts table foreign keys
ALTER TABLE public.posts 
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.posts 
ADD CONSTRAINT posts_community_id_fkey 
FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

-- Comments table foreign keys
ALTER TABLE public.comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_parent_id_fkey 
FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE;

-- Likes table foreign keys
ALTER TABLE public.likes 
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.likes 
ADD CONSTRAINT likes_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.likes 
ADD CONSTRAINT likes_comment_id_fkey 
FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;

-- Post saves foreign keys
ALTER TABLE public.post_saves 
ADD CONSTRAINT post_saves_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.post_saves 
ADD CONSTRAINT post_saves_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- Post hashtags foreign keys
ALTER TABLE public.post_hashtags 
ADD CONSTRAINT post_hashtags_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.post_hashtags 
ADD CONSTRAINT post_hashtags_hashtag_id_fkey 
FOREIGN KEY (hashtag_id) REFERENCES public.hashtags(id) ON DELETE CASCADE;

-- Post mentions foreign keys
ALTER TABLE public.post_mentions 
ADD CONSTRAINT post_mentions_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.post_mentions 
ADD CONSTRAINT post_mentions_mentioned_user_id_fkey 
FOREIGN KEY (mentioned_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Post reports foreign keys
ALTER TABLE public.post_reports 
ADD CONSTRAINT post_reports_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.post_reports 
ADD CONSTRAINT post_reports_reported_by_fkey 
FOREIGN KEY (reported_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Communities foreign keys
ALTER TABLE public.communities 
ADD CONSTRAINT communities_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.communities_enhanced 
ADD CONSTRAINT communities_enhanced_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Community members foreign keys
ALTER TABLE public.community_members 
ADD CONSTRAINT community_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.community_members 
ADD CONSTRAINT community_members_community_id_fkey 
FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

-- Community memberships foreign keys
ALTER TABLE public.community_memberships 
ADD CONSTRAINT community_memberships_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.community_memberships 
ADD CONSTRAINT community_memberships_community_id_fkey 
FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

-- Community roles foreign keys
ALTER TABLE public.community_roles 
ADD CONSTRAINT community_roles_community_id_fkey 
FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

-- Community channels foreign keys
ALTER TABLE public.community_channels 
ADD CONSTRAINT community_channels_community_id_fkey 
FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

ALTER TABLE public.community_channels 
ADD CONSTRAINT community_channels_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Messages foreign keys
ALTER TABLE public.messages 
ADD CONSTRAINT messages_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_channel_id_fkey 
FOREIGN KEY (channel_id) REFERENCES public.community_channels(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_dm_conversation_id_fkey 
FOREIGN KEY (dm_conversation_id) REFERENCES public.dm_conversations(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_reply_to_fkey 
FOREIGN KEY (reply_to) REFERENCES public.messages(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_thread_root_fkey 
FOREIGN KEY (thread_root) REFERENCES public.messages(id) ON DELETE CASCADE;

-- Events foreign keys
ALTER TABLE public.events 
ADD CONSTRAINT events_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.events 
ADD CONSTRAINT events_community_id_fkey 
FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

-- Event RSVPs foreign keys
ALTER TABLE public.event_rsvps 
ADD CONSTRAINT event_rsvps_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.event_rsvps 
ADD CONSTRAINT event_rsvps_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Event notifications foreign keys
ALTER TABLE public.event_notifications 
ADD CONSTRAINT event_notifications_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.event_notifications 
ADD CONSTRAINT event_notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Notifications foreign keys
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User related table foreign keys
ALTER TABLE public.user_blocks 
ADD CONSTRAINT user_blocks_blocker_id_fkey 
FOREIGN KEY (blocker_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_blocks 
ADD CONSTRAINT user_blocks_blocked_id_fkey 
FOREIGN KEY (blocked_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_security_settings 
ADD CONSTRAINT user_security_settings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_bookmarks 
ADD CONSTRAINT user_bookmarks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_bookmarks 
ADD CONSTRAINT user_bookmarks_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;

ALTER TABLE public.user_achievements 
ADD CONSTRAINT user_achievements_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_reports 
ADD CONSTRAINT user_reports_reported_user_id_fkey 
FOREIGN KEY (reported_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_reports 
ADD CONSTRAINT user_reports_reported_by_fkey 
FOREIGN KEY (reported_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_reports 
ADD CONSTRAINT user_reports_resolved_by_fkey 
FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Moderation related foreign keys
ALTER TABLE public.moderation_actions 
ADD CONSTRAINT moderation_actions_moderator_id_fkey 
FOREIGN KEY (moderator_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.moderation_actions 
ADD CONSTRAINT moderation_actions_target_id_fkey 
FOREIGN KEY (target_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.moderation_actions 
ADD CONSTRAINT moderation_actions_reversed_by_fkey 
FOREIGN KEY (reversed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.moderation_logs 
ADD CONSTRAINT moderation_logs_community_id_fkey 
FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

ALTER TABLE public.moderation_logs 
ADD CONSTRAINT moderation_logs_moderator_id_fkey 
FOREIGN KEY (moderator_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.moderation_logs 
ADD CONSTRAINT moderation_logs_target_user_id_fkey 
FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.automated_moderation_rules 
ADD CONSTRAINT automated_moderation_rules_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.content_flags 
ADD CONSTRAINT content_flags_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.content_flags 
ADD CONSTRAINT content_flags_rule_id_fkey 
FOREIGN KEY (rule_id) REFERENCES public.automated_moderation_rules(id) ON DELETE SET NULL;

-- Security events foreign keys
ALTER TABLE public.security_events 
ADD CONSTRAINT security_events_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Message reads foreign keys
ALTER TABLE public.message_reads 
ADD CONSTRAINT message_reads_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;

ALTER TABLE public.message_reads 
ADD CONSTRAINT message_reads_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Typing indicators foreign keys
ALTER TABLE public.typing_indicators 
ADD CONSTRAINT typing_indicators_channel_id_fkey 
FOREIGN KEY (channel_id) REFERENCES public.community_channels(id) ON DELETE CASCADE;

ALTER TABLE public.typing_indicators 
ADD CONSTRAINT typing_indicators_dm_conversation_id_fkey 
FOREIGN KEY (dm_conversation_id) REFERENCES public.dm_conversations(id) ON DELETE CASCADE;

ALTER TABLE public.typing_indicators 
ADD CONSTRAINT typing_indicators_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Pinned messages foreign keys
ALTER TABLE public.pinned_messages 
ADD CONSTRAINT pinned_messages_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;

ALTER TABLE public.pinned_messages 
ADD CONSTRAINT pinned_messages_channel_id_fkey 
FOREIGN KEY (channel_id) REFERENCES public.community_channels(id) ON DELETE CASCADE;

ALTER TABLE public.pinned_messages 
ADD CONSTRAINT pinned_messages_dm_conversation_id_fkey 
FOREIGN KEY (dm_conversation_id) REFERENCES public.dm_conversations(id) ON DELETE CASCADE;

ALTER TABLE public.pinned_messages 
ADD CONSTRAINT pinned_messages_pinned_by_fkey 
FOREIGN KEY (pinned_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Custom emojis foreign keys
ALTER TABLE public.custom_emojis 
ADD CONSTRAINT custom_emojis_community_id_fkey 
FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

ALTER TABLE public.custom_emojis 
ADD CONSTRAINT custom_emojis_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Voice sessions foreign keys
ALTER TABLE public.voice_sessions 
ADD CONSTRAINT voice_sessions_channel_id_fkey 
FOREIGN KEY (channel_id) REFERENCES public.community_channels(id) ON DELETE CASCADE;

ALTER TABLE public.voice_sessions 
ADD CONSTRAINT voice_sessions_started_by_fkey 
FOREIGN KEY (started_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Study sessions foreign keys  
ALTER TABLE public.study_sessions 
ADD CONSTRAINT study_sessions_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Mentorship matches foreign keys
ALTER TABLE public.mentorship_matches 
ADD CONSTRAINT mentorship_matches_mentor_id_fkey 
FOREIGN KEY (mentor_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.mentorship_matches 
ADD CONSTRAINT mentorship_matches_mentee_id_fkey 
FOREIGN KEY (mentee_id) REFERENCES auth.users(id) ON DELETE CASCADE;
