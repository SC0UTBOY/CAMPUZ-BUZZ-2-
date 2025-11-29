
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRetryableQuery } from './useRetryableQuery';

export interface OptimizedUserProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  major?: string;
  department?: string;
  year?: string;
  role: string;
  engagement_score: number;
  school?: string;
  gpa?: number;
  graduation_year?: number;
  skills?: string[];
  interests?: string[];
  social_links?: Record<string, string>;
  privacy_settings?: {
    email_visible?: boolean;
    profile_visible?: boolean;
    academic_info_visible?: boolean;
    notifications?: {
      posts: boolean;
      comments: boolean;
      mentions: boolean;
      messages: boolean;
      events: boolean;
    };
  };
  created_at: string;
  updated_at: string;
}

// Helper function to safely convert Json to Record<string, any>
const convertJsonToRecord = (json: any): Record<string, any> | null => {
  if (!json) return null;
  if (typeof json === 'object' && json !== null) {
    return json as Record<string, any>;
  }
  return null;
};

export const useOptimizedProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<OptimizedUserProfile | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProfile = useCallback(async (): Promise<OptimizedUserProfile | null> => {
    if (!user) return null;

    try {
      // For the current user, we should rely on the Auth metadata as the source of truth
      // because the 'profiles' view might not contain all fields (like bio, major, etc.)
      // unless they are explicitly exposed in the view definition.
      // Also, we can't write to the view, so we must read from where we write (metadata).

      const { data: { user: freshUser }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Error fetching user data:', error);
        throw error;
      }

      if (!freshUser) return null;

      const metadata = freshUser.user_metadata || {};

      // Construct the profile object from metadata
      const userProfile: OptimizedUserProfile = {
        id: freshUser.id,
        user_id: freshUser.id,
        display_name: metadata.display_name || metadata.full_name || freshUser.email?.split('@')[0] || 'User',
        bio: metadata.bio,
        avatar_url: metadata.avatar_url,
        major: metadata.major,
        department: metadata.department,
        year: metadata.year,
        role: metadata.role || 'student',
        engagement_score: metadata.engagement_score || 0,
        school: metadata.school,
        gpa: metadata.gpa,
        graduation_year: metadata.graduation_year,
        skills: metadata.skills || [],
        interests: metadata.interests || [],
        social_links: convertJsonToRecord(metadata.social_links),
        privacy_settings: convertJsonToRecord(metadata.privacy_settings) || {
          email_visible: false,
          profile_visible: true,
          academic_info_visible: true,
          notifications: {
            posts: true,
            comments: true,
            mentions: true,
            messages: true,
            events: true
          }
        },
        created_at: freshUser.created_at,
        updated_at: freshUser.updated_at || new Date().toISOString(),
      };

      return userProfile;
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  }, [user]);

  const {
    data: fetchedProfile,
    loading,
    error,
    retry
  } = useRetryableQuery({
    queryFn: fetchProfile,
    retryAttempts: 2,
    retryDelay: 500,
  });

  useEffect(() => {
    if (fetchedProfile) {
      setProfile(fetchedProfile);
    }
  }, [fetchedProfile]);

  const updateProfile = useCallback(async (updates: Partial<OptimizedUserProfile>) => {
    if (!user || !profile) {
      throw new Error('No user or profile found');
    }

    try {
      setIsUpdating(true);

      // Optimistically update local state
      const optimisticProfile = { ...profile, ...updates };
      setProfile(optimisticProfile);

      // Update Supabase Auth Metadata
      // We filter out fields that shouldn't be in metadata or are read-only from auth user
      const { id, user_id, created_at, updated_at, ...metadataUpdates } = updates;

      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...metadataUpdates,
          updated_at: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }

      if (data.user) {
        // Re-fetch or re-construct profile to ensure consistency
        const metadata = data.user.user_metadata || {};
        const updatedProfile: OptimizedUserProfile = {
          ...profile,
          ...updates, // Apply updates
          // Ensure critical fields are preserved
          id: data.user.id,
          user_id: data.user.id,
          updated_at: data.user.updated_at || new Date().toISOString(),
        };
        setProfile(updatedProfile);
      }

      return true;
    } catch (error) {
      // Revert optimistic update on error
      setProfile(profile);
      console.error('Profile update error:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [user, profile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetchProfile: retry,
    isUpdating,
  };
};
