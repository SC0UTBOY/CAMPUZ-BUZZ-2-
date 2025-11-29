
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { listUserRooms } from '@/features/chat/chatApi';
import { RoomWithLastMessage } from '@/features/chat/chatTypes';
import { Plus, Hash, MessageCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface ChatRoomListProps {
  selectedRoomId?: string;
  onRoomSelect: (room: RoomWithLastMessage) => void;
  onCreateRoom: () => void;
  onNewDM: () => void;
}

export const ChatRoomList: React.FC<ChatRoomListProps> = ({
  selectedRoomId,
  onRoomSelect,
  onCreateRoom,
  onNewDM,
}) => {
  const [rooms, setRooms] = useState<RoomWithLastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setIsLoading(true);
      const data = await listUserRooms();
      setRooms(data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Separate rooms into groups and DMs
  const groupRooms = rooms.filter(room => !room.is_private || room.participants.length > 2);
  const directMessages = rooms.filter(room => room.is_private && room.participants.length === 2);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: false });
    } catch {
      return '';
    }
  };

  const RoomItem = ({ room }: { room: RoomWithLastMessage }) => {
    const isDM = room.is_private && room.participants.length === 2;
    const otherParticipant = isDM ? room.participants.find(p => p.user_id !== room.created_by) : null;
    const displayName = isDM && otherParticipant ? otherParticipant.display_name || 'Unknown User' : room.name;
    const avatarUrl = isDM && otherParticipant ? otherParticipant.avatar_url : null;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <Button
          variant={selectedRoomId === room.id ? 'secondary' : 'ghost'}
          className="w-full justify-start h-auto p-3"
          onClick={() => onRoomSelect(room)}
        >
          <div className="flex items-center space-x-3 w-full">
            <div className="flex-shrink-0">
              {isDM ? (
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center justify-between">
                <div className="font-medium truncate">{displayName}</div>
                {room.last_message_time && (
                  <div className="text-xs text-muted-foreground ml-2">
                    {formatTime(room.last_message_time)}
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {room.last_message || `${room.participants.length} members`}
              </div>
            </div>
            {room.unread_count > 0 && (
              <Badge variant="default" className="ml-2 min-w-[20px] h-5 flex items-center justify-center">
                {room.unread_count}
              </Badge>
            )}
          </div>
        </Button>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="w-80 border-r bg-muted/30 p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Chats</h2>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={onNewDM} title="New Direct Message">
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={onCreateRoom} title="Create Group">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {/* Direct Messages Section */}
          {directMessages.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Direct Messages
              </div>
              <div className="space-y-1">
                <AnimatePresence>
                  {directMessages.map((room) => (
                    <RoomItem key={room.id} room={room} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Group Rooms Section */}
          {groupRooms.length > 0 && (
            <div>
              {directMessages.length > 0 && <Separator className="my-2" />}
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Rooms
              </div>
              <div className="space-y-1">
                <AnimatePresence>
                  {groupRooms.map((room) => (
                    <RoomItem key={room.id} room={room} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {rooms.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm mb-3">No chats yet</p>
              <div className="space-y-2">
                <Button size="sm" variant="outline" onClick={onNewDM} className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start a conversation
                </Button>
                <Button size="sm" variant="outline" onClick={onCreateRoom} className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Create a group
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
