
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Star, Send, Check, X, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMentorshipMatching } from '@/hooks/useMentorshipMatching';

export const MentorshipHub: React.FC = () => {
  const { mentors, mentorshipRequests, loading, requestMentorship, respondToRequest } = useMentorshipMatching();
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [requestMessage, setRequestMessage] = useState('');

  const handleSendRequest = async () => {
    if (!selectedMentor) return;
    
    const success = await requestMentorship(selectedMentor.user_id, requestMessage);
    if (success) {
      setSelectedMentor(null);
      setRequestMessage('');
    }
  };

  const pendingRequests = mentorshipRequests.filter(r => r.status === 'pending');
  const acceptedConnections = mentorshipRequests.filter(r => r.status === 'accepted');

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-muted"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Mentorship Hub</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Connect with experienced students and mentors to accelerate your academic journey
        </p>
      </div>

      <Tabs defaultValue="find-mentors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="find-mentors">Find Mentors</TabsTrigger>
          <TabsTrigger value="requests">
            Requests 
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="connections">My Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="find-mentors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentors.map((mentor) => (
              <motion.div
                key={mentor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={mentor.avatar_url} />
                        <AvatarFallback>{mentor.display_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{mentor.display_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {mentor.major} • {mentor.year}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm">{mentor.engagement_score}</span>
                      </div>
                    </div>
                    
                    {mentor.bio && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {mentor.bio}
                      </p>
                    )}

                    {mentor.skills && mentor.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {mentor.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {mentor.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{mentor.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => setSelectedMentor(mentor)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Request Mentorship
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request Mentorship</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={selectedMentor?.avatar_url} />
                              <AvatarFallback>{selectedMentor?.display_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{selectedMentor?.display_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {selectedMentor?.major} • {selectedMentor?.year}
                              </p>
                            </div>
                          </div>
                          <Textarea
                            placeholder="Tell them why you'd like their mentorship..."
                            value={requestMessage}
                            onChange={(e) => setRequestMessage(e.target.value)}
                            rows={4}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setSelectedMentor(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSendRequest}>
                              Send Request
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                <p className="text-muted-foreground">
                  Your mentorship requests will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={request.mentee?.avatar_url} />
                          <AvatarFallback>{request.mentee?.display_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{request.mentee?.display_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {request.mentee?.major} • {request.mentee?.year}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => respondToRequest(request.id, 'declined')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => respondToRequest(request.id, 'accepted')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          {acceptedConnections.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
                <p className="text-muted-foreground">
                  Your mentorship connections will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acceptedConnections.map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={connection.mentor?.avatar_url || connection.mentee?.avatar_url} />
                        <AvatarFallback>
                          {(connection.mentor?.display_name || connection.mentee?.display_name)?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {connection.mentor?.display_name || connection.mentee?.display_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {connection.mentor?.major || connection.mentee?.major} • 
                          {connection.mentor?.year || connection.mentee?.year}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {connection.mentor ? 'Mentor' : 'Mentee'}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
