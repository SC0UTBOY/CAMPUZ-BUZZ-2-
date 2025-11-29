import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageInput } from './MessageInput';
import { fetchMessages, markRoomRead } from '@/features/chat/chatApi';
import { supabase } from '@/integrations/supabase/client';
import { ChatRoom, MessageWithSender } from '@/features/chat/chatTypes';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Download, Trash2, UserPlus, Users as UsersIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddMembersModal } from './AddMembersModal';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface MemberProfile {
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ChatInterfaceProps {
  room: ChatRoom;
  onRoomDeleted?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ room, onRoomDeleted }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [showMemberList, setShowMemberList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    fetchMembers();

    // Subscribe to new messages
    if (!room.id) return;

    const messageChannel = supabase
      .channel(`chat-room:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT + DELETE + UPDATE
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${room.id}`
        },
        async (payload) => {
          console.log('Realtime message event:', payload);

          if (payload.eventType === 'INSERT') {
            // Fetch sender info for the new message
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url, username')
              .eq('user_id', payload.new.user_id)
              .single();

            const newMessage: MessageWithSender = {
              ...(payload.new as any),
              sender: {
                user_id: senderProfile?.id || payload.new.user_id,
                display_name: senderProfile?.display_name || null,
                avatar_url: senderProfile?.avatar_url || null,
              },
            };

            // Prevent duplicates by checking if message already exists
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === newMessage.id);
              if (exists) return prev;
              return [...prev, newMessage];
            });
          }

          if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }

          if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((m) => (m.id === payload.new.id ? { ...m, ...(payload.new as any) } : m))
            );
          }
        }
      )
      .subscribe();

    // Subscribe to member changes
    const memberChannel = supabase
      .channel(`room-members-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_participants',
          filter: `room_id=eq.${room.id}`
        },
        () => {
          console.log('Member list changed, refreshing...');
          fetchMembers();
        }
      )
      .subscribe();

    // Mark room as read when opening
    markRoomRead(room.id).catch(console.error);

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(memberChannel);
    };
  }, [room.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const data = await fetchMessages(room.id);
      // Replace entire array to prevent duplicates
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          user_id,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('room_id', room.id);

      if (error) {
        console.error('Error fetching members:', error);
        return;
      }

      setMembers((data || []) as unknown as MemberProfile[]);
    } catch (error) {
      console.error('Error in fetchMembers:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMessageSent = () => {
    scrollToBottom();
    // Mark as read after sending
    markRoomRead(room.id).catch(console.error);
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
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

  const parseAttachments = (attachments: any) => {
    if (!attachments) return [];
    try {
      if (typeof attachments === 'string') {
        return JSON.parse(attachments);
      }
      return Array.isArray(attachments) ? attachments : [];
    } catch {
      return [];
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove this member from the room?')) return;

    try {
      const { error } = await supabase
        .from('chat_participants')
        .delete()
        .eq('room_id', room.id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing member:', error);
        toast({
          title: 'Error',
          description: 'Failed to remove member.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        description: 'Member removed successfully.'
      });
    } catch (error) {
      console.error('Error in handleRemoveMember:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteRoom = async () => {
    if (!confirm("Are you sure you want to delete this chat room for everyone?")) return;

    try {
      const { error } = await supabase
        .from("chat_rooms")
        .delete()
        .eq("id", room.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete chat room.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Deleted",
        description: "Chat room deleted successfully."
      });

      // Notify parent to refresh and clear selection
      onRoomDeleted?.();
    } catch (error) {
      console.error('Error deleting chat room:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat room.",
        variant: "destructive"
      });
    }
  };

  const MessageBubble = ({ message, isOwn }: { message: MessageWithSender; isOwn: boolean }) => {
    const attachments = parseAttachments(message.attachments);
    const hasAttachments = attachments.length > 0;

    const handleDeleteMessage = async (id: string) => {
      if (!confirm('Delete this message?')) return;

      const { deleteMessage } = await import('@/features/chat/chatApi');
      const result = await deleteMessage(id);

      if (!result.success) {
        console.error('Failed to delete message');
      } else {
        // Message will auto-refresh via realtime, but remove immediately for better UX
        setMessages(prev => prev.filter(m => m.id !== id));
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 px-4`}
      >
        <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[70%]`}>
          {!isOwn && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.sender.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(message.sender.display_name)}
              </AvatarFallback>
            </Avatar>
          )}

          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} relative group`}>
            {!isOwn && (
              <span className="text-xs text-muted-foreground mb-1 px-3">
                {message.sender.display_name || 'Unknown User'}
              </span>
            )}

            <div
              className={`rounded-2xl px-4 py-2 ${isOwn
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
                }`}
            >
              {/* Delete button only for sender */}
              {isOwn && (
                <button
                  onClick={() => handleDeleteMessage(message.id)}
                  className="absolute top-1 right-1 p-1 rounded-md bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                  title="Delete message"
                >
                  🗑️
                </button>
              )}

              {/* Display attachments */}
              {hasAttachments && (
                <div className="space-y-2 mb-2">
                  {attachments.map((attachment: any, index: number) => {
                    const isImage = attachment.type?.startsWith('image/');

                    if (isImage) {
                      return (
                        <div key={index} className="rounded-lg overflow-hidden max-w-xs">
                          <img
                            src={attachment.url}
                            alt={attachment.name || 'Image'}
                            className="w-full h-auto"
                          />
                        </div>
                      );
                    } else {
                      return (
                        <a
                          key={index}
                          href={attachment.url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 p-2 rounded-lg ${isOwn ? 'bg-primary-foreground/10' : 'bg-background'
                            } hover:opacity-80 transition-opacity`}
                        >
                          <Download className="h-4 w-4" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {attachment.name || 'File'}
                            </div>
                            {attachment.size && (
                              <div className="text-xs opacity-70">
                                {(attachment.size / 1024).toFixed(1)} KB
                              </div>
                            )}
                          </div>
                        </a>
                      );
                    }
                  })}
                </div>
              )}

              {/* Display text content */}
              {message.content && (
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              )}

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-semibold">{room.name}</h2>
              <div className="text-muted-foreground text-sm">
                Members: {members.length}
              </div>
            </div>
            {room.description && (
              <p className="text-sm text-muted-foreground">{room.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Member List */}
            <Popover open={showMemberList} onOpenChange={setShowMemberList}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <UsersIcon className="h-4 w-4" />
                  <span>{members.length} {members.length === 1 ? 'Member' : 'Members'}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm mb-3">Room Members</h4>
                  <ScrollArea className="h-[300px] pr-4">
                    {members.map((member) => (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between py-2 px-2 hover:bg-muted rounded-md transition"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profiles?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.profiles?.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {member.profiles?.display_name || 'Unknown User'}
                            {member.user_id === room.created_by && (
                              <span className="ml-2 text-xs text-muted-foreground">(Owner)</span>
                            )}
                          </span>
                        </div>

                        {/* Only show remove button if current user is owner and member is not owner */}
                        {room.created_by === user?.id && member.user_id !== room.created_by && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>

            {/* Add Members button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddMembersModal(true)}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add
            </Button>

            {/* Only show delete button if current user is creator */}
            {room.created_by === user?.id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteRoom}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="py-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.user_id === user?.id}
              />
            ))}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <MessageInput roomId={room.id} onMessageSent={handleMessageSent} />

      {/* Add Members Modal */}
      <AddMembersModal
        open={showAddMembersModal}
        onOpenChange={setShowAddMembersModal}
        roomId={room.id}
        roomName={room.name}
      />
    </div>
  );
};
