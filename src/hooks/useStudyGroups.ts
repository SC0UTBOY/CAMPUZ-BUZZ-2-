
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studyGroupsService, StudySession, StudyMaterial } from '@/services/studyGroupsService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useStudyGroups = (studyGroupId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sessions
  const {
    data: sessions,
    isLoading: loadingSessions,
    refetch: refetchSessions
  } = useQuery({
    queryKey: ['study-sessions', studyGroupId],
    queryFn: () => studyGroupsService.getGroupSessions(studyGroupId!),
    enabled: !!studyGroupId,
  });

  // Materials
  const {
    data: materials,
    isLoading: loadingMaterials,
    refetch: refetchMaterials
  } = useQuery({
    queryKey: ['study-materials', studyGroupId],
    queryFn: () => studyGroupsService.getGroupMaterials(studyGroupId!),
    enabled: !!studyGroupId,
  });

  // Analytics
  const {
    data: analytics,
    isLoading: loadingAnalytics
  } = useQuery({
    queryKey: ['study-analytics', studyGroupId],
    queryFn: () => studyGroupsService.getGroupStats(studyGroupId!),
    enabled: !!studyGroupId,
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: studyGroupsService.createSession,
    onSuccess: () => {
      toast({
        title: "Session created!",
        description: "Your study session has been scheduled successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create session",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Join session mutation
  const joinSessionMutation = useMutation({
    mutationFn: ({ sessionId, userId }: { sessionId: string; userId: string }) =>
      studyGroupsService.joinSession(sessionId, userId),
    onSuccess: () => {
      toast({
        title: "Joined session!",
        description: "You have successfully registered for this session."
      });
      queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to join session",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Leave session mutation
  const leaveSessionMutation = useMutation({
    mutationFn: ({ sessionId, userId }: { sessionId: string; userId: string }) =>
      studyGroupsService.leaveSession(sessionId, userId),
    onSuccess: () => {
      toast({
        title: "Left session",
        description: "You have been removed from this session."
      });
      queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to leave session",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Upload material mutation
  const uploadMaterialMutation = useMutation({
    mutationFn: ({ 
      studyGroupId, 
      userId, 
      file, 
      materialData 
    }: {
      studyGroupId: string;
      userId: string;
      file: File;
      materialData: {
        title: string;
        description?: string;
        tags?: string[];
        is_public?: boolean;
      };
    }) => studyGroupsService.uploadMaterial(studyGroupId, userId, file, materialData),
    onSuccess: () => {
      toast({
        title: "Material uploaded!",
        description: "Your study material has been shared with the group."
      });
      queryClient.invalidateQueries({ queryKey: ['study-materials'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to upload material",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: ({ materialId, userId }: { materialId: string; userId: string }) =>
      studyGroupsService.deleteMaterial(materialId, userId),
    onSuccess: () => {
      toast({
        title: "Material deleted",
        description: "The study material has been removed."
      });
      queryClient.invalidateQueries({ queryKey: ['study-materials'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete material",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
  });

  return {
    // Data
    sessions: sessions || [],
    materials: materials || [],
    analytics,
    
    // Loading states
    loadingSessions,
    loadingMaterials,
    loadingAnalytics,
    
    // Actions
    createSession: createSessionMutation.mutate,
    joinSession: (sessionId: string) => joinSessionMutation.mutate({ sessionId, userId: user?.id! }),
    leaveSession: (sessionId: string) => leaveSessionMutation.mutate({ sessionId, userId: user?.id! }),
    uploadMaterial: (file: File, materialData: any) => 
      uploadMaterialMutation.mutate({ 
        studyGroupId: studyGroupId!, 
        userId: user?.id!, 
        file, 
        materialData 
      }),
    deleteMaterial: (materialId: string) => 
      deleteMaterialMutation.mutate({ materialId, userId: user?.id! }),
    
    // Loading states for mutations
    creatingSession: createSessionMutation.isPending,
    joiningSession: joinSessionMutation.isPending,
    leavingSession: leaveSessionMutation.isPending,
    uploadingMaterial: uploadMaterialMutation.isPending,
    deletingMaterial: deleteMaterialMutation.isPending,
    
    // Refetch functions
    refetchSessions,
    refetchMaterials
  };
};
