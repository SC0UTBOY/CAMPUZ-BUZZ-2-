import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fetchInbox, InboxItem } from '@/lib/chat';
import { motion } from 'framer-motion';

interface DMListProps {
    selectedUserId: string | null;
    onUserSelect: (userId: string, userName: string, avatarUrl: string | null) => void;
    onNewDM: () => void;
}

export const DMList: React.FC<DMListProps> = ({
    selectedUserId,
    onUserSelect,
    onNewDM
}) => {
    const { user } = useAuth();
    const [dmConversations, setDmConversations] = useState<InboxItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDMConversations();
    }, []);

    // Realtime subscription for DM updates
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`dm-${user.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'direct_messages' },
                (payload) => {
                    console.log('DM update:', payload);
                    loadDMConversations(); // Refresh list on any DM change
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const loadDMConversations = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await fetchInbox();

            if (error) {
                console.error('Error loading DM conversations:', error);
                setDmConversations([]);
            } else {
                // Filter to only show DM conversations (not rooms)
                const dms = (data || []).filter(item => item.type === 'dm');
                setDmConversations(dms);
            }
        } catch (error) {
            console.error('Error in loadDMConversations:', error);
            setDmConversations([]);
        } finally {
            setIsLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatTime = (timestamp: string | undefined) => {
        if (!timestamp) return '';
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch {
            return '';
        }
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Direct Messages</CardTitle>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onNewDM}
                        className="h-8 w-8 p-0"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <ScrollArea className="flex-1">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : dmConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <Search className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="font-medium mb-2">No conversations yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Search for users to start a conversation
                        </p>
                        <Button onClick={onNewDM} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            New Message
                        </Button>
                    </div>
                ) : (
                    <div className="p-2">
                        {dmConversations.map((conversation) => (
                            <motion.button
                                key={conversation.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() =>
                                    onUserSelect(
                                        conversation.other_user_id!,
                                        conversation.name,
                                        conversation.avatar_url || null
                                    )
                                }
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${selectedUserId === conversation.other_user_id
                                    ? 'bg-accent'
                                    : 'hover:bg-accent/50'
                                    }`}
                            >
                                <div className="relative">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={conversation.avatar_url || undefined} />
                                        <AvatarFallback>{getInitials(conversation.name)}</AvatarFallback>
                                    </Avatar>
                                    {/* Optional: Add online indicator */}
                                    {/* <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" /> */}
                                </div>

                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-medium truncate">{conversation.name}</p>
                                        {conversation.last_message_at && (
                                            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                                {formatTime(conversation.last_message_at)}
                                            </span>
                                        )}
                                    </div>
                                    {conversation.last_message && (
                                        <p className="text-sm text-muted-foreground truncate">
                                            {conversation.last_message}
                                        </p>
                                    )}
                                </div>

                                {/* Optional: Unread count badge */}
                                {conversation.unread_count && conversation.unread_count > 0 && (
                                    <div className="flex-shrink-0 bg-primary text-primary-foreground text-xs font-medium h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center">
                                        {conversation.unread_count}
                                    </div>
                                )}
                            </motion.button>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </Card>
    );
};
