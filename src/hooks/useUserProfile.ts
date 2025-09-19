
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { databaseService } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  major: string | null;
  department: string | null;
  year: string | null;
  role: string | null;
  school: string | null;
  skills: string[] | null;
  interests: string[] | null;
  engagement_score: number | null;
  gpa: number | null;
  graduation_year: number | null;
  social_links: Record<string, any> | null;
  privacy_settings: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let profileData = await databaseService.getProfile(user.id);
      
      if (!profileData) {
        // Create profile if it doesn't exist
        profileData = await databaseService.createProfile(user.id, {
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User'
        });
      }
      
      setProfile(profileData as UserProfile);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      setError(error.message);
      toast({
        title: "Error loading profile",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) {
      throw new Error('No user or profile found');
    }

    try {
      const updatedProfile = await databaseService.updateProfile(user.id, updates);
      setProfile(updatedProfile as UserProfile);
      
      toast({
        title: "Profile updated!",
        description: "Your changes have been saved successfully."
      });

      return updatedProfile;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateAvatar = async (avatarUrl: string) => {
    return updateProfile({ avatar_url: avatarUrl });
  };

  const refetchProfile = () => {
    loadProfile();
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateAvatar,
    refetchProfile
  };
};
