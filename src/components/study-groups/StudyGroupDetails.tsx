
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Calendar, 
  MapPin, 
  BookOpen,
  Clock,
  User
} from 'lucide-react';

interface StudyGroupMember {
  id: string;
  study_group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

interface StudyGroupDetailsProps {
  group: {
    id: string;
    name: string;
    subject: string;
    description: string | null;
    location?: string | null;
    max_members: number | null;
    tags: string[] | null;
    created_at: string;
    members: StudyGroupMember[];
    member_count: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onJoin: () => void;
  onLeave: () => void;
  isMember: boolean;
}

export const StudyGroupDetails: React.FC<StudyGroupDetailsProps> = ({
  group,
  isOpen,
  onClose,
  onJoin,
  onLeave,
  isMember,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{group.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <BookOpen className="h-4 w-4" />
                <span>{group.subject}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{group.member_count}/{group.max_members || 'Unlimited'}</span>
              </div>
              {group.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{group.location}</span>
                </div>
              )}
            </div>
            
            {group.description && (
              <p className="text-muted-foreground">{group.description}</p>
            )}
            
            {group.tags && group.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {group.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Members Section */}
          <div className="space-y-3">
            <h3 className="font-semibold">Members ({group.member_count})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {group.members.map(member => (
                <div key={member.id} className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Member</p>
                    <p className="text-xs text-muted-foreground">
                      {member.role === 'admin' ? 'Admin' : 'Member'}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {isMember ? (
              <Button variant="destructive" onClick={onLeave}>
                Leave Group
              </Button>
            ) : (
              <Button 
                onClick={onJoin}
                disabled={group.max_members ? group.member_count >= group.max_members : false}
              >
                {group.max_members && group.member_count >= group.max_members ? 'Full' : 'Join Group'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
