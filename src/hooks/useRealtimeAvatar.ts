import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to sync avatar updates in real-time across all components
 * Subscribes to profiles table changes for the current user
 */
export function useRealtimeAvatar() {
    const { user } = useAuth();
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) {
            setIsLoading(false);
            return;
        }

        // Fetch initial avatar
        const fetchAvatar = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('id', user.id)
                    .single();

                if (!error && data) {
                    setAvatarUrl(data.avatar_url);
                }
            } catch (error) {
                console.error('Error fetching avatar:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAvatar();

        // Subscribe to real-time updates
        const channel = supabase
            .channel(`profile-avatar-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Avatar updated:', payload);
                    if (payload.new && 'avatar_url' in payload.new) {
                        setAvatarUrl((payload.new as any).avatar_url);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    return { avatarUrl, isLoading };
}
