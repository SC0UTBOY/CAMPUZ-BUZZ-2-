
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface MentorProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  major?: string;
  year?: string;
  bio?: string;
  skills?: string[];
  engagement_score: number;
  is_mentor: boolean;
}

export interface MentorshipRequest {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  mentor?: MentorProfile;
  mentee?: MentorProfile;
}

export const useMentorshipMatching = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [myMentees, setMyMentees] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMentors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'mentor')
        .gte('engagement_score', 50)
        .order('engagement_score', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedMentors: MentorProfile[] = (data || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        display_name: profile.display_name || 'Anonymous',
        avatar_url: profile.avatar_url || undefined,
        major: profile.major || undefined,
        year: profile.year || undefined,
        bio: profile.bio || undefined,
        skills: profile.skills || undefined,
        engagement_score: profile.engagement_score || 0,
        is_mentor: profile.role === 'mentor'
      }));
      
      setMentors(transformedMentors);
    } catch (error) {
      console.error('Error loading mentors:', error);
    }
  };

  const loadMentorshipRequests = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('mentorship_matches')
        .select('*')
        .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get mentor and mentee profiles separately
      const requests = data || [];
      const mentorIds = [...new Set(requests.map(r => r.mentor_id))];
      const menteeIds = [...new Set(requests.map(r => r.mentee_id))];
      
      const { data: mentorProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', mentorIds);
        
      const { data: menteeProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', menteeIds);
      
      // Transform the data to match our interface
      const transformedRequests: MentorshipRequest[] = requests.map(request => {
        const mentorProfile = mentorProfiles?.find(p => p.user_id === request.mentor_id);
        const menteeProfile = menteeProfiles?.find(p => p.user_id === request.mentee_id);
        
        return {
          id: request.id,
          mentor_id: request.mentor_id,
          mentee_id: request.mentee_id,
          status: request.status as MentorshipRequest['status'],
          created_at: request.created_at,
          mentor: mentorProfile ? {
            id: mentorProfile.id,
            user_id: mentorProfile.user_id,
            display_name: mentorProfile.display_name || 'Anonymous',
            avatar_url: mentorProfile.avatar_url || undefined,
            major: mentorProfile.major || undefined,
            year: mentorProfile.year || undefined,
            bio: mentorProfile.bio || undefined,
            skills: mentorProfile.skills || undefined,
            engagement_score: mentorProfile.engagement_score || 0,
            is_mentor: true
          } : undefined,
          mentee: menteeProfile ? {
            id: menteeProfile.id,
            user_id: menteeProfile.user_id,
            display_name: menteeProfile.display_name || 'Anonymous',
            avatar_url: menteeProfile.avatar_url || undefined,
            major: menteeProfile.major || undefined,
            year: menteeProfile.year || undefined,
            bio: menteeProfile.bio || undefined,
            skills: menteeProfile.skills || undefined,
            engagement_score: menteeProfile.engagement_score || 0,
            is_mentor: false
          } : undefined
        };
      });
      
      setMentorshipRequests(transformedRequests);
    } catch (error) {
      console.error('Error loading mentorship requests:', error);
    }
  };

  const requestMentorship = async (mentorId: string, message?: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('mentorship_matches')
        .insert({
          mentor_id: mentorId,
          mentee_id: user.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Mentorship request sent!",
        description: "Your mentor will be notified of your request."
      });

      await loadMentorshipRequests();
      return true;
    } catch (error) {
      console.error('Error requesting mentorship:', error);
      toast({
        title: "Error",
        description: "Failed to send mentorship request.",
        variant: "destructive"
      });
      return false;
    }
  };

  const respondToRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('mentorship_matches')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: status === 'accepted' ? "Request accepted!" : "Request declined",
        description: status === 'accepted' 
          ? "You now have a new mentee!" 
          : "The request has been declined."
      });

      await loadMentorshipRequests();
      return true;
    } catch (error) {
      console.error('Error responding to request:', error);
      toast({
        title: "Error",
        description: "Failed to respond to request.",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadMentors(),
        loadMentorshipRequests()
      ]);
      setLoading(false);
    };

    loadData();
  }, [user?.id]);

  return {
    mentors,
    mentorshipRequests,
    myMentees,
    loading,
    requestMentorship,
    respondToRequest,
    refetch: () => {
      loadMentors();
      loadMentorshipRequests();
    }
  };
};
