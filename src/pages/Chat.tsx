
import React, { useState } from 'react';
import { ChatRoomList } from '@/components/chat/ChatRoomList';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { CreateRoomModal } from '@/components/chat/CreateRoomModal';
import { DMList } from '@/components/chat/DMList';
import { DMInterface } from '@/components/chat/DMInterface';
import { UserSearchModal } from '@/components/chat/UserSearchModal';
import { RoomWithLastMessage } from '@/features/chat/chatTypes';
import { EmptyState } from '@/components/common/EmptyState';
import { MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ViewMode = 'rooms' | 'dms';

export const Chat = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('rooms');
  const [selectedRoom, setSelectedRoom] = useState<RoomWithLastMessage | null>(null);
  const [selectedDMUser, setSelectedDMUser] = useState<{
    userId: string;
    userName: string;
    avatarUrl: string | null;
  } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRoomSelect = (room: RoomWithLastMessage) => {
    setSelectedRoom(room);
    setSelectedDMUser(null);
  };

  const handleDMUserSelect = (userId: string, userName: string, avatarUrl: string | null) => {
    setSelectedDMUser({ userId, userName, avatarUrl });
    setSelectedRoom(null);
  };

  const handleUserSearchSelect = (userId: string, userProfile: any) => {
    setSelectedDMUser({
      userId,
      userName: userProfile.display_name || userProfile.username || 'Unknown User',
      avatarUrl: userProfile.avatar_url
    });
    setSelectedRoom(null);
    setViewMode('dms');
  };

  const handleCreateRoom = () => {
    setShowCreateModal(true);
  };

  const handleNewDM = () => {
    setShowUserSearch(true);
  };

  const handleRoomCreated = (roomId: string) => {
    setRefreshKey(prev => prev + 1);
    setShowCreateModal(false);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSelectedRoom(null);
    setSelectedDMUser(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-full">
      {/* Tab Switcher */}
      <div className="border-b bg-card">
        <div className="flex gap-2 p-2">
          <Button
            variant={viewMode === 'rooms' ? 'default' : 'ghost'}
            onClick={() => handleViewModeChange('rooms')}
            className="flex-1"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Rooms
          </Button>
          <Button
            variant={viewMode === 'dms' ? 'default' : 'ghost'}
            onClick={() => handleViewModeChange('dms')}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            Direct Messages
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - List */}
        {viewMode === 'rooms' ? (
          <ChatRoomList
            key={refreshKey}
            selectedRoomId={selectedRoom?.id}
            onRoomSelect={handleRoomSelect}
            onCreateRoom={handleCreateRoom}
            onNewDM={handleNewDM}
          />
        ) : (
          <DMList
            selectedUserId={selectedDMUser?.userId || null}
            onUserSelect={handleDMUserSelect}
            onNewDM={handleNewDM}
          />
        )}

        {/* Right Panel - Conversation */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <ChatInterface
              room={selectedRoom}
              onRoomDeleted={() => {
                setSelectedRoom(null);
                setRefreshKey(prev => prev + 1);
              }}
            />
          ) : selectedDMUser ? (
            <DMInterface
              otherUserId={selectedDMUser.userId}
              otherUserName={selectedDMUser.userName}
              otherUserAvatar={selectedDMUser.avatarUrl}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={viewMode === 'rooms' ? <MessageSquare className="h-12 w-12" /> : <Users className="h-12 w-12" />}
                title={viewMode === 'rooms' ? 'No chat selected' : 'No conversation selected'}
                description={viewMode === 'rooms' ? 'Choose a room to start messaging' : 'Select a conversation or start a new one'}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateRoomModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onRoomCreated={handleRoomCreated}
      />

      <UserSearchModal
        open={showUserSearch}
        onOpenChange={setShowUserSearch}
        onUserSelect={handleUserSearchSelect}
      />
    </div>
  );
};

export default Chat;
