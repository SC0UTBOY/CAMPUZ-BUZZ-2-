
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ModerationService, PostReport, UserReport, ModerationAction } from '@/services/moderationService';
import { useToast } from '@/hooks/use-toast';

export const useModeration = () => {
  const [reportFilters, setReportFilters] = useState({ status: 'pending' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get post reports
  const {
    data: postReports,
    isLoading: loadingPostReports,
    refetch: refetchPostReports
  } = useQuery({
    queryKey: ['post-reports', reportFilters],
    queryFn: () => ModerationService.getPostReports(reportFilters.status),
  });

  // Get user reports
  const {
    data: userReports,
    isLoading: loadingUserReports,
    refetch: refetchUserReports
  } = useQuery({
    queryKey: ['user-reports', reportFilters],
    queryFn: () => ModerationService.getUserReports(reportFilters.status),
  });

  // Get moderation actions
  const {
    data: moderationActions,
    isLoading: loadingActions
  } = useQuery({
    queryKey: ['moderation-actions'],
    queryFn: () => ModerationService.getModerationActions(),
  });

  // Get auto moderation rules
  const {
    data: autoRules,
    isLoading: loadingAutoRules,
    refetch: refetchAutoRules
  } = useQuery({
    queryKey: ['auto-moderation-rules'],
    queryFn: () => ModerationService.getAutoModerationRules(),
  });

  // Create post report mutation
  const createPostReportMutation = useMutation({
    mutationFn: ModerationService.createPostReport,
    onSuccess: () => {
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe."
      });
      queryClient.invalidateQueries({ queryKey: ['post-reports'] });
    },
    onError: (error) => {
      toast({
        title: "Error submitting report",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Create user report mutation
  const createUserReportMutation = useMutation({
    mutationFn: ModerationService.createUserReport,
    onSuccess: () => {
      toast({
        title: "Report submitted",
        description: "Thank you for reporting this user."
      });
      queryClient.invalidateQueries({ queryKey: ['user-reports'] });
    },
    onError: (error) => {
      toast({
        title: "Error submitting report",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Take moderation action mutation
  const moderationActionMutation = useMutation({
    mutationFn: ModerationService.takeModerationAction,
    onSuccess: (data) => {
      toast({
        title: "Moderation action taken",
        description: `Successfully applied ${data.action_type} action.`
      });
      queryClient.invalidateQueries({ queryKey: ['moderation-actions'] });
      queryClient.invalidateQueries({ queryKey: ['post-reports'] });
      queryClient.invalidateQueries({ queryKey: ['user-reports'] });
    },
    onError: (error) => {
      toast({
        title: "Error taking action",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Create auto moderation rule mutation
  const createAutoRuleMutation = useMutation({
    mutationFn: ModerationService.createAutoModerationRule,
    onSuccess: () => {
      toast({
        title: "Auto moderation rule created",
        description: "The rule is now active."
      });
      refetchAutoRules();
    },
    onError: (error) => {
      toast({
        title: "Error creating rule",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Resolve report mutation
  const resolveReportMutation = useMutation({
    mutationFn: ({ reportId, reportType, resolution }: {
      reportId: string;
      reportType: 'post' | 'user';
      resolution: { status: 'resolved' | 'dismissed'; notes?: string };
    }) => ModerationService.resolveReport(reportId, reportType, resolution),
    onSuccess: () => {
      toast({
        title: "Report resolved",
        description: "The report has been processed."
      });
      queryClient.invalidateQueries({ queryKey: ['post-reports'] });
      queryClient.invalidateQueries({ queryKey: ['user-reports'] });
    },
    onError: (error) => {
      toast({
        title: "Error resolving report",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
  });

  return {
    // Data
    postReports: postReports?.reports || [],
    userReports: userReports?.reports || [],
    moderationActions: moderationActions?.actions || [],
    autoRules: autoRules || [],
    
    // Loading states
    loadingPostReports,
    loadingUserReports,
    loadingActions,
    loadingAutoRules,
    
    // Filters
    reportFilters,
    setReportFilters,
    
    // Actions
    createPostReport: createPostReportMutation.mutate,
    createUserReport: createUserReportMutation.mutate,
    takeModerationAction: moderationActionMutation.mutate,
    createAutoRule: createAutoRuleMutation.mutate,
    resolveReport: resolveReportMutation.mutate,
    
    // Loading states for mutations
    creatingPostReport: createPostReportMutation.isPending,
    creatingUserReport: createUserReportMutation.isPending,
    takingAction: moderationActionMutation.isPending,
    creatingAutoRule: createAutoRuleMutation.isPending,
    resolvingReport: resolveReportMutation.isPending,
    
    // Refetch functions
    refetchPostReports,
    refetchUserReports,
    refetchAutoRules
  };
};
