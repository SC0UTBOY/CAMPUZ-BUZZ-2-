
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Calendar, 
  FileText, 
  BarChart3, 
  MessageSquare 
} from 'lucide-react';
import { StudyMaterials } from './StudyMaterials';
import { SessionsList } from './SessionsList';
import { StudyGroupAnalytics } from './StudyGroupAnalytics';
import { ChatInterface } from '../chat/ChatInterface';
import { studyGroupsService } from '@/services/studyGroupsService';
import { useQuery } from '@tanstack/react-query';

interface StudyGroupTabsProps {
  studyGroupId: string;
  groupName: string;
  onScheduleSession: (groupId: string) => void;
}

export const StudyGroupTabs: React.FC<StudyGroupTabsProps> = ({ 
  studyGroupId, 
  groupName, 
  onScheduleSession 
}) => {
  // Get or create chat room for the study group
  const { data: chatRoom } = useQuery({
    queryKey: ['study-group-chat', studyGroupId],
    queryFn: async () => {
      let room = await studyGroupsService.getGroupChatRoom(studyGroupId);
      if (!room) {
        // Create chat room if it doesn't exist
        room = await studyGroupsService.createGroupChatRoom(
          studyGroupId, 
          groupName, 
          '' // Will be set by the service
        );
      }
      return room;
    },
  });

  return (
    <Tabs defaultValue="sessions" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="sessions" className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Sessions</span>
        </TabsTrigger>
        <TabsTrigger value="materials" className="flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Materials</span>
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center space-x-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Analytics</span>
        </TabsTrigger>
        <TabsTrigger value="chat" className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Chat</span>
        </TabsTrigger>
        <TabsTrigger value="members" className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Members</span>
        </TabsTrigger>
      </TabsList>

      <div className="mt-6">
        <TabsContent value="sessions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Study Sessions</h3>
            <button
              onClick={() => onScheduleSession(studyGroupId)}
              className="btn btn-primary"
            >
              Schedule Session
            </button>
          </div>
          <SessionsList studyGroupId={studyGroupId} />
        </TabsContent>

        <TabsContent value="materials">
          <StudyMaterials studyGroupId={studyGroupId} />
        </TabsContent>

        <TabsContent value="analytics">
          <StudyGroupAnalytics studyGroupId={studyGroupId} />
        </TabsContent>

        <TabsContent value="chat">
          {chatRoom ? (
            <ChatInterface room={chatRoom} />
          ) : (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="members">
          <div className="text-center p-8 text-muted-foreground">
            Member management will be implemented here
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
};
