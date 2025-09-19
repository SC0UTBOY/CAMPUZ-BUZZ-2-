
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Edit, 
  Delete, 
  Download,
  ExternalLink,
  Share2,
  Video,
  Tag,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { EventDetails, eventManagementService } from '@/services/eventManagementService';
import { EventRSVPButton } from './EventRSVPButton';
import { EditEventModal } from './EditEventModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EventDetailsModalProps {
  eventId: string | null;
  open: boolean;
  onClose: () => void;
  onEventUpdated?: () => void;
  onEventDeleted?: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  eventId,
  open,
  onClose,
  onEventUpdated,
  onEventDeleted
}) => {
  const { user } = useAuth();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (eventId && open) {
      loadEventDetails();
      loadAttendees();
    } else if (!open) {
      // Reset state when modal is closed
      setEvent(null);
      setAttendees([]);
      setLoading(true);
    }
  }, [eventId, open]);

  const loadEventDetails = async () => {
    if (!eventId) return;
    
    try {
      setLoading(true);
      const eventDetails = await eventManagementService.getEventDetails(eventId);
      setEvent(eventDetails);
    } catch (error) {
      console.error('Error loading event details:', error);
      // Only show toast if modal is still open
      if (open) {
        toast.error('Failed to load event details');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAttendees = async () => {
    if (!eventId) return;
    
    try {
      const attendeesData = await eventManagementService.getEventAttendees(eventId);
      setAttendees(attendeesData);
    } catch (error) {
      console.error('Error loading attendees:', error);
      // Only log error, don't show toast for attendees as it's less critical
    }
  };

  const handleRSVP = async (status: 'going' | 'maybe' | 'not_going') => {
    if (!eventId) return;
    
    try {
      await eventManagementService.rsvpToEvent(eventId, status);
      // Only reload if the modal is still open
      if (open) {
        await Promise.all([loadEventDetails(), loadAttendees()]);
      }
    } catch (error) {
      console.error('RSVP error:', error);
      toast.error('Failed to update RSVP');
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventId || !event) return;
    
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await eventManagementService.deleteEvent(eventId);
      onEventDeleted?.();
      onClose();
    } catch (error) {
      toast.error('Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const handleCalendarExport = (type: 'google' | 'outlook' | 'ics') => {
    if (!event) return;

    switch (type) {
      case 'google':
        window.open(eventManagementService.generateGoogleCalendarLink(event), '_blank');
        break;
      case 'outlook':
        window.open(eventManagementService.generateOutlookCalendarLink(event), '_blank');
        break;
      case 'ics':
        const icsContent = eventManagementService.generateICSFile(event);
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Calendar file downloaded!');
        break;
    }
  };

  const handleShare = async () => {
    if (!event) return;
    
    const shareData = {
      title: event.title,
      text: event.description || '',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Event link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!event) return null;

  const goingAttendees = attendees.filter(a => a.status === 'going');
  const maybeAttendees = attendees.filter(a => a.status === 'maybe');

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold mb-2">
                  {event.title}
                </DialogTitle>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">{event.event_type}</Badge>
                  {event.is_virtual && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      Virtual
                    </Badge>
                  )}
                  {!event.is_public && (
                    <Badge variant="outline">Private</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                {event.can_edit && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditModal(true)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteEvent}
                      disabled={deleting}
                      className="text-destructive hover:text-destructive"
                    >
                      <Delete className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6">
              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{format(new Date(event.start_time), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>
                      {format(new Date(event.start_time), 'h:mm a')} - 
                      {format(new Date(event.end_time), 'h:mm a')}
                    </span>
                  </div>

                  {event.location && (
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{event.location}</span>
                    </div>
                  )}

                  {event.meeting_link && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Video className="h-4 w-4 text-primary" />
                      <a 
                        href={event.meeting_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Join Virtual Meeting
                      </a>
                    </div>
                  )}

                  {event.community_id && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span>Community Event</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span>
                      {event.attendee_count} attending
                      {event.max_attendees && ` (max ${event.max_attendees})`}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* RSVP Section */}
                  <EventRSVPButton
                    eventId={event.id}
                    currentStatus={event.user_rsvp_status}
                    attendeeCount={event.attendee_count}
                    onRSVP={handleRSVP}
                  />

                  {/* Calendar Export */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Add to Calendar</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCalendarExport('google')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Google
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCalendarExport('outlook')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Outlook
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCalendarExport('ics')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Attendees */}
              <div>
                <h4 className="font-medium mb-4">
                  Attendees ({goingAttendees.length})
                </h4>
                
                {goingAttendees.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {goingAttendees.slice(0, 8).map((attendee) => (
                        <div key={attendee.user_id} className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={attendee.avatar_url} />
                            <AvatarFallback>
                              {attendee.display_name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {attendee.display_name}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {goingAttendees.length > 8 && (
                      <p className="text-sm text-muted-foreground">
                        +{goingAttendees.length - 8} more attendees
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No attendees yet</p>
                )}

                {maybeAttendees.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium mb-2 text-sm">
                      Maybe Attending ({maybeAttendees.length})
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {maybeAttendees.slice(0, 5).map((attendee) => (
                        <div key={attendee.user_id} className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={attendee.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {attendee.display_name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">
                            {attendee.display_name}
                          </span>
                        </div>
                      ))}
                      {maybeAttendees.length > 5 && (
                        <span className="text-xs text-muted-foreground">
                          +{maybeAttendees.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <EditEventModal
        event={event}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onEventUpdated={() => {
          setShowEditModal(false);
          loadEventDetails();
          onEventUpdated?.();
        }}
      />
    </>
  );
};
