
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Clock, MapPin, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CreateStudyGroupModal } from './CreateStudyGroupModal';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subject: string;
  tags: string[];
  location?: string;
  max_members: number;
  is_private: boolean;
  created_by: string;
  created_at: string;
  member_count?: number;
}

interface StudyGroupManagerProps {
  onScheduleSession: (groupId: string) => void;
}

export const StudyGroupManager: React.FC<StudyGroupManagerProps> = ({ onScheduleSession }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadStudyGroups();
      loadMyGroups();
    }
  }, [user]);

  const loadStudyGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('study_groups')
        .select(`
          *,
          study_group_members(count)
        `)
        .eq('is_private', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const groupsWithMemberCount = data?.map(group => ({
        ...group,
        member_count: group.study_group_members?.length || 0
      })) || [];

      setStudyGroups(groupsWithMemberCount);
    } catch (error) {
      console.error('Error loading study groups:', error);
    }
  };

  const loadMyGroups = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('study_groups')
        .select(`
          *,
          study_group_members!inner(user_id)
        `)
        .eq('study_group_members.user_id', user.id);

      if (error) throw error;
      setMyGroups(data || []);
    } catch (error) {
      console.error('Error loading my groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('study_group_members')
        .insert({
          study_group_id: groupId,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Joined study group!",
        description: "You can now participate in group activities."
      });

      loadMyGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Failed to join group",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const StudyGroupCard = ({ group, showJoinButton = false }: { group: StudyGroup; showJoinButton?: boolean }) => (
    <Card key={group.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{group.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{group.subject}</p>
          </div>
          <Badge variant={group.is_private ? "secondary" : "default"}>
            {group.is_private ? 'Private' : 'Public'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{group.description}</p>
        
        <div className="flex flex-wrap gap-1">
          {group.tags?.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{group.member_count || 0}/{group.max_members}</span>
            </div>
            {group.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{group.location}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {showJoinButton ? (
            <Button 
              onClick={() => joinGroup(group.id)}
              disabled={group.member_count >= group.max_members}
              className="flex-1"
            >
              {group.member_count >= group.max_members ? 'Full' : 'Join Group'}
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => onScheduleSession(group.id)}
                className="flex-1"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Study Group
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discover">Discover Groups</TabsTrigger>
          <TabsTrigger value="my-groups">My Groups ({myGroups.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-4 mt-6">
          {studyGroups.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No study groups found</h3>
                <p className="text-muted-foreground">Be the first to create a study group!</p>
              </CardContent>
            </Card>
          ) : (
            studyGroups.map((group) => (
              <StudyGroupCard key={group.id} group={group} showJoinButton />
            ))
          )}
        </TabsContent>

        <TabsContent value="my-groups" className="space-y-4 mt-6">
          {myGroups.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">You haven't joined any groups yet</h3>
                <p className="text-muted-foreground">Join a study group to start collaborating!</p>
              </CardContent>
            </Card>
          ) : (
            myGroups.map((group) => (
              <StudyGroupCard key={group.id} group={group} />
            ))
          )}
        </TabsContent>
      </Tabs>

      <CreateStudyGroupModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onGroupCreated={() => {
          setShowCreateModal(false);
          loadStudyGroups();
          loadMyGroups();
        }}
      />
    </div>
  );
};
