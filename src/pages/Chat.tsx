
import React, { useState } from 'react';
import { ChatRoomList } from '@/components/chat/ChatRoomList';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { CreateRoomModal } from '@/components/chat/CreateRoomModal';
import { type RoomWithDetails } from '@/services/fixedChatService';
import { EmptyState } from '@/components/common/EmptyState';
import { MessageSquare } from 'lucide-react';

export const Chat = () => {
  const [selectedRoom, setSelectedRoom] = useState<RoomWithDetails | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRoomSelect = (room: RoomWithDetails) => {
    setSelectedRoom(room);
  };

  const handleCreateRoom = () => {
    setShowCreateModal(true);
  };

  const handleRoomCreated = () => {
    setRefreshKey(prev => prev + 1);
    setShowCreateModal(false);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] max-w-full">
      <ChatRoomList
        key={refreshKey}
        selectedRoomId={selectedRoom?.id}
        onRoomSelect={handleRoomSelect}
        onCreateRoom={handleCreateRoom}
      />
      
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <ChatInterface room={selectedRoom} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<MessageSquare className="h-12 w-12" />}
              title="No room selected"
              description="Choose a chat room to start messaging"
            />
          </div>
        )}
      </div>

      <CreateRoomModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onRoomCreated={handleRoomCreated}
      />
    </div>
  );
};

export default Chat;
