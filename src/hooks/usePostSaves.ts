import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePostSaves = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if already saved
      const { data: existingSave } = await supabase
        .from('post_saves')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingSave) {
        // Remove save
        await supabase
          .from('post_saves')
          .delete()
          .eq('id', existingSave.id);
        return { action: 'removed' };
      } else {
        // Add save
        await supabase
          .from('post_saves')
          .insert({
            post_id: postId,
            user_id: user.id
          });
        return { action: 'added' };
      }
    },
    onMutate: (postId) => {
      setLoadingStates(prev => ({ ...prev, [postId]: true }));
    },
    onSuccess: (result, postId) => {
      // Invalidate posts queries to refresh the feed
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      
      toast({
        description: result.action === 'added' ? "Post saved" : "Post removed from saved",
      });
    },
    onError: (error, postId) => {
      console.error('Error saving post:', error);
      toast({
        title: "Error",
        description: "Failed to save post. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: (_, __, postId) => {
      setLoadingStates(prev => ({ ...prev, [postId]: false }));
    }
  });

  const toggleSave = useCallback((postId: string) => {
    if (loadingStates[postId]) return;
    saveMutation.mutate(postId);
  }, [saveMutation, loadingStates]);

  return {
    toggleSave,
    isLoading: (postId: string) => loadingStates[postId] || false,
    isSaving: saveMutation.isPending
  };
};