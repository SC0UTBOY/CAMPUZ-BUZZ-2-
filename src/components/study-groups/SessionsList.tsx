
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Users, 
  UserPlus, 
  UserMinus,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useStudyGroups } from '@/hooks/useStudyGroups';
import { useAuth } from '@/contexts/AuthContext';
import { StudySession } from '@/services/studyGroupsService';

interface SessionsListProps {
  studyGroupId: string;
}

const getSessionStatus = (scheduledAt: string) => {
  const now = new Date();
  const sessionTime = new Date(scheduledAt);
  const diffMs = sessionTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < -2) return { status: 'completed', color: 'bg-green-500' };
  if (diffHours < 0) return { status: 'ongoing', color: 'bg-yellow-500' };
  if (diffHours < 24) return { status: 'upcoming', color: 'bg-blue-500' };
  return { status: 'scheduled', color: 'bg-gray-500' };
};

export const SessionsList: React.FC<SessionsListProps> = ({ studyGroupId }) => {
  const { user } = useAuth();
  const { 
    sessions, 
    loadingSessions, 
    joinSession, 
    leaveSession,
    joiningSession,
    leavingSession 
  } = useStudyGroups(studyGroupId);

  if (loadingSessions) {
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

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No sessions scheduled</h3>
          <p className="text-muted-foreground">Schedule your first study session to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const sessionStatus = getSessionStatus(session.scheduled_at);
        const participants = Array.isArray(session.participants) ? session.participants : [];
        const isParticipant = participants.some(p => p.user_id === user?.id);
        const isFull = session.max_participants && session.participant_count >= session.max_participants;

        return (
          <Card key={session.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <span>{session.title}</span>
                    <div className={`w-2 h-2 rounded-full ${sessionStatus.color}`} />
                  </CardTitle>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {sessionStatus.status}
                  </Badge>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(session.scheduled_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {session.description && (
                <p className="text-sm text-muted-foreground">{session.description}</p>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{session.duration_minutes} min</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {session.is_virtual ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                    <span>
                      {session.is_virtual ? 'Virtual Meeting' : session.location || 'Location TBD'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {session.participant_count}
                      {session.max_participants && `/${session.max_participants}`}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {isParticipant ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => leaveSession(session.id)}
                      disabled={leavingSession}
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Leave
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => joinSession(session.id)}
                      disabled={joiningSession || isFull}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      {isFull ? 'Full' : 'Join'}
                    </Button>
                  )}
                  
                  {session.is_virtual && session.meeting_link && isParticipant && (
                    <Button 
                      size="sm"
                      onClick={() => window.open(session.meeting_link, '_blank')}
                    >
                      <Video className="h-4 w-4 mr-1" />
                      Join Meeting
                    </Button>
                  )}
                </div>
              </div>
              
              {participants.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">Participants</h5>
                  <div className="flex flex-wrap gap-2">
                    {participants.slice(0, 5).map((participant) => (
                      <div key={participant.id} className="flex items-center space-x-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={participant.profiles?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {participant.profiles?.display_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">
                          {participant.profiles?.display_name || 'User'}
                        </span>
                        {participant.status === 'attended' && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                        {participant.status === 'missed' && (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    ))}
                    {participants.length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{participants.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
