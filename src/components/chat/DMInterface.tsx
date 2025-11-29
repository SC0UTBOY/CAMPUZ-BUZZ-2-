import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fetchDirectMessages, createDirectMessage, markMessagesAsRead, DirectMessage } from '@/lib/chat';
import { motion, AnimatePresence } from 'framer-motion';

interface DMInterfaceProps {
    otherUserId: string;
    otherUserName: string;
    otherUserAvatar: string | null;
}

export const DMInterface: React.FC<DMInterfaceProps> = ({
    otherUserId,
    otherUserName,
    otherUserAvatar
}) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [displayName, setDisplayName] = useState(otherUserName);
    const [displayAvatar, setDisplayAvatar] = useState(otherUserAvatar);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadMessages();
        markAsRead();
        fetchOtherUserProfile();
    }, [otherUserId]);

    // Realtime subscription for new messages
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('direct-messages')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `sender_id=eq.${user.id},receiver_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('DM realtime event:', payload);
                    // Reload messages automatically
                    loadMessages();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, otherUserId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await fetchDirectMessages(otherUserId);

            if (error) {
                console.error('Error loading messages:', error);
                setMessages([]);
            } else {
                setMessages(data || []);
            }
        } catch (error) {
            console.error('Error in loadMessages:', error);
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async () => {
        try {
            await markMessagesAsRead(otherUserId);
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const fetchOtherUserProfile = async () => {
        try {
            // First, try to get profile from messages if available
            if (messages.length > 0 && user) {
                const otherUserIdFromMsg = messages[0]?.sender_id === user.id
                    ? messages[0].receiver_id
                    : messages[0].sender_id;

                if (otherUserIdFromMsg) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('display_name, avatar_url')
                        .eq('id', otherUserIdFromMsg)
                        .single();

                    if (profile) {
                        setDisplayName(profile.display_name || otherUserName);
                        setDisplayAvatar(profile.avatar_url || otherUserAvatar);
                        return;
                    }
                }
            }

            // Fallback: fetch using the otherUserId prop
            const { data: profile } = await supabase
                .from('profiles')
                .select('display_name, avatar_url')
                .eq('id', otherUserId)
                .single();

            if (profile) {
                setDisplayName(profile.display_name || otherUserName);
                setDisplayAvatar(profile.avatar_url || otherUserAvatar);
            }
        } catch (error) {
            console.error('Error fetching other user profile:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || isSending || !user) return;

        const messageContent = newMessage.trim();
        setNewMessage('');
        setIsSending(true);

        try {
            const { error } = await createDirectMessage(otherUserId, messageContent);

            if (error) {
                console.error('Error sending message:', error);
                // Restore message on error
                setNewMessage(messageContent);
            }
            // Message will be added via realtime subscription automatically
        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            setNewMessage(messageContent);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
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

    const formatTime = (timestamp: string) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch {
            return '';
        }
    };

    const MessageBubble = ({ message }: { message: DirectMessage }) => {
        const isOwn = message.sender_id === user?.id;
        const senderName = isOwn
            ? 'You'
            : message.sender?.display_name ?? "Unknown User";
        const senderAvatar = isOwn
            ? user?.user_metadata?.avatar_url
            : message.sender?.avatar_url ?? null;

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 px-4`}
            >
                <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[70%]`}>
                    {!isOwn && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={senderAvatar || undefined} />
                            <AvatarFallback className="text-xs">
                                {getInitials(senderName)}
                            </AvatarFallback>
                        </Avatar>
                    )}

                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                        {!isOwn && (
                            <span className="text-xs text-muted-foreground mb-1 px-3">
                                {senderName}
                            </span>
                        )}

                        <div
                            className={`rounded-2xl px-4 py-2 ${isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                                }`}
                        >
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            <div className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {formatTime(message.created_at)}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full">
            <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={displayAvatar || undefined} />
                        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-semibold">{displayName}</h2>
                    </div>
                </div>
            </CardHeader>

            <ScrollArea className="flex-1" ref={scrollAreaRef}>
                <div className="py-4">
                    <AnimatePresence initial={false}>
                        {messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            <div className="border-t p-4">
                <div className="flex gap-2">
                    <Textarea
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="min-h-[60px] max-h-[120px] resize-none"
                        disabled={isSending}
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        size="icon"
                        className="h-[60px] w-[60px]"
                    >
                        {isSending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
