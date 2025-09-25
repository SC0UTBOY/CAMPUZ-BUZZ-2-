
import { supabase } from '@/integrations/supabase/client';
import { fileUploadService, FileUploadType } from './fileUploadService';

export interface StudySession {
  id: string;
  study_group_id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  location?: string;
  meeting_link?: string;
  is_virtual: boolean;
  max_participants?: number;
  created_by: string;
  created_at: string;
  participant_count?: number;
  participants?: SessionParticipant[];
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  status: 'registered' | 'attended' | 'missed' | 'cancelled';
  joined_at: string;
  left_at?: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
}

export interface StudyMaterial {
  id: string;
  study_group_id: string;
  uploaded_by: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size: number;
  tags: string[];
  is_public: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
}

export interface StudyGroupAnalytics {
  id: string;
  study_group_id: string;
  metric_type: string;
  metric_value: any;
  recorded_at: string;
  period_start?: string;
  period_end?: string;
}

export interface StudyGroupStats {
  memberCount: number;
  sessionCount: number;
  materialCount: number;
  recentActivity: StudyGroupAnalytics[];
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

class StudyGroupsService {
  // Session Management
  async createSession(sessionData: Omit<StudySession, 'id' | 'created_at' | 'participant_count'>): Promise<StudySession> {
    const { data, error } = await supabase
      .from('study_sessions')
      .insert(sessionData)
      .select('*')
      .single();

    if (error) throw error;
    return data as StudySession;
  }

  async getGroupSessions(studyGroupId: string): Promise<StudySession[]> {
    const { data, error } = await supabase
      .from('study_sessions')
      .select(`
        *,
        session_participants(
          id,
          session_id,
          user_id,
          status,
          joined_at,
          left_at,
          profiles:user_id(display_name, avatar_url)
        )
      `)
      .eq('study_group_id', studyGroupId)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;

    return data?.map(session => {
      const participants: SessionParticipant[] = (session.session_participants || []).map((p: any) => ({
        id: p.id,
        session_id: p.session_id || session.id,
        user_id: p.user_id,
        status: p.status as SessionParticipant['status'],
        joined_at: p.joined_at,
        left_at: p.left_at,
        profiles: p.profiles
      }));

      return {
        ...session,
        participant_count: participants.length,
        participants
      } as StudySession;
    }) || [];
  }

  async joinSession(sessionId: string, userId: string): Promise<SessionParticipant> {
    const { data, error } = await supabase
      .from('session_participants')
      .insert({
        session_id: sessionId,
        user_id: userId,
        status: 'registered'
      })
      .select('*')
      .single();

    if (error) throw error;
    return {
      ...data,
      status: data.status as SessionParticipant['status']
    };
  }

  async updateSessionStatus(sessionId: string, userId: string, status: SessionParticipant['status']): Promise<SessionParticipant> {
    const { data, error } = await supabase
      .from('session_participants')
      .update({ status })
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return {
      ...data,
      status: data.status as SessionParticipant['status']
    };
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Study Materials Management
  async uploadMaterial(
    studyGroupId: string,
    userId: string,
    file: File,
    materialData: {
      title: string;
      description?: string;
      tags?: string[];
      is_public?: boolean;
    }
  ): Promise<StudyMaterial> {
    // Upload file to Supabase Storage
    const uploadResult = await fileUploadService.uploadFile(file, 'attachment', userId);

    // Create material record
    const { data, error } = await supabase
      .from('study_materials')
      .insert({
        study_group_id: studyGroupId,
        uploaded_by: userId,
        title: materialData.title,
        description: materialData.description,
        file_url: uploadResult.url,
        file_type: uploadResult.fileType,
        file_size: uploadResult.fileSize,
        tags: materialData.tags || [],
        is_public: materialData.is_public ?? true
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as StudyMaterial;
  }

  async getGroupMaterials(studyGroupId: string): Promise<StudyMaterial[]> {
    const { data, error } = await supabase
      .from('study_materials')
      .select(`
        *,
        profiles:uploaded_by(display_name, avatar_url)
      `)
      .eq('study_group_id', studyGroupId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as StudyMaterial[];
  }

  async deleteMaterial(materialId: string, userId: string): Promise<void> {
    // Get material details first to delete file
    const { data: material, error: fetchError } = await supabase
      .from('study_materials')
      .select('file_url, uploaded_by')
      .eq('id', materialId)
      .eq('uploaded_by', userId)
      .single();

    if (fetchError) throw fetchError;

    // Delete file from storage
    await fileUploadService.deleteFile(material.file_url, 'attachment');

    // Delete material record
    const { error } = await supabase
      .from('study_materials')
      .delete()
      .eq('id', materialId)
      .eq('uploaded_by', userId);

    if (error) throw error;
  }

  async incrementDownloadCount(materialId: string): Promise<void> {
    // Use manual increment since RPC function doesn't exist
    const { data: material } = await supabase
      .from('study_materials')
      .select('download_count')
      .eq('id', materialId)
      .single();

    if (material) {
      await supabase
        .from('study_materials')
        .update({ download_count: material.download_count + 1 })
        .eq('id', materialId);
    }
  }

  // Analytics
  async getGroupAnalytics(studyGroupId: string, metricType?: string): Promise<StudyGroupAnalytics[]> {
    let query = supabase
      .from('study_group_analytics')
      .select('*')
      .eq('study_group_id', studyGroupId)
      .order('recorded_at', { ascending: false });

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as StudyGroupAnalytics[];
  }

  async getGroupStats(studyGroupId: string): Promise<StudyGroupStats> {
    // Get member count
    const { count: memberCount, error: membersError } = await supabase
      .from('study_group_members')
      .select('*', { count: 'exact', head: true })
      .eq('study_group_id', studyGroupId);

    if (membersError) throw membersError;

    // Get session count
    const { count: sessionCount, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('study_group_id', studyGroupId);

    if (sessionsError) throw sessionsError;

    // Get materials count
    const { count: materialCount, error: materialsError } = await supabase
      .from('study_materials')
      .select('*', { count: 'exact', head: true })
      .eq('study_group_id', studyGroupId);

    if (materialsError) throw materialsError;

    // Get recent activity
    const { data: recentActivity, error: activityError } = await supabase
      .from('study_group_analytics')
      .select('*')
      .eq('study_group_id', studyGroupId)
      .order('recorded_at', { ascending: false })
      .limit(10);

    if (activityError) throw activityError;

    const stats: StudyGroupStats = {
      memberCount: memberCount || 0,
      sessionCount: sessionCount || 0,
      materialCount: materialCount || 0,
      recentActivity: (recentActivity || []) as StudyGroupAnalytics[]
    };

    return stats;
  }

  // Chat Integration
  async createGroupChatRoom(studyGroupId: string, groupName: string, createdBy: string): Promise<ChatRoom> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({
        name: `${groupName} - Study Group Chat`,
        description: `Chat room for ${groupName} study group`,
        is_private: false,
        created_by: createdBy
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as ChatRoom;
  }

  async getGroupChatRoom(studyGroupId: string): Promise<ChatRoom | null> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('name', `%${studyGroupId}%`)
      .ilike('name', `%Study Group Chat%`)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as ChatRoom | null;
  }
}

export const studyGroupsService = new StudyGroupsService();
