
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, Video, Building2 } from 'lucide-react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { Event } from '@/services/eventService';

interface EventCardProps {
  event: Event;
  onEventClick: (event: Event) => void;
  showRSVP?: boolean;
  compact?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onEventClick, 
  showRSVP = true,
  compact = false 
}) => {
  const formatEventDate = (date: string) => {
    const eventDate = new Date(date);
    if (isToday(eventDate)) return 'Today';
    if (isTomorrow(eventDate)) return 'Tomorrow';
    if (isYesterday(eventDate)) return 'Yesterday';
    return format(eventDate, 'MMM d');
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'study_session': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'social': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'career': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'academic': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'sports': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'workshop': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const isPastEvent = new Date(event.end_time) < new Date();

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
        isPastEvent ? 'opacity-75' : ''
      } ${compact ? 'p-2' : ''}`}
      onClick={() => onEventClick(event)}
    >
      <CardHeader className={compact ? 'p-3 pb-2' : 'pb-3'}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="secondary" 
                className={`text-xs ${getEventTypeColor(event.event_type)}`}
              >
                {event.event_type.replace('_', ' ')}
              </Badge>
              {event.is_virtual && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  Virtual
                </Badge>
              )}
              {event.community_id && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Community
                </Badge>
              )}
              {isPastEvent && (
                <Badge variant="secondary" className="text-xs">
                  Past
                </Badge>
              )}
            </div>
            
            <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-lg'} truncate`}>
              {event.title}
            </h3>
            
            {!compact && event.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {event.description}
              </p>
            )}
          </div>
          
          {event.image_url && (
            <div className="ml-3 flex-shrink-0">
              <img 
                src={event.image_url} 
                alt={event.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className={compact ? 'p-3 pt-0' : 'pt-0'}>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2 text-primary" />
            <span>{formatEventDate(event.start_time)}</span>
            <span className="mx-2">•</span>
            <Clock className="h-4 w-4 mr-1 text-primary" />
            <span>
              {format(new Date(event.start_time), 'h:mm a')}
            </span>
          </div>

          {(event.location || event.meeting_link) && (
            <div className="flex items-center text-sm text-muted-foreground">
              {event.is_virtual ? (
                <Video className="h-4 w-4 mr-2 text-primary" />
              ) : (
                <MapPin className="h-4 w-4 mr-2 text-primary" />
              )}
              <span className="truncate">
                {event.is_virtual ? 'Virtual Event' : event.location}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-2 text-primary" />
              <span>
                {event.attendee_count} attending
                {event.max_attendees && ` / ${event.max_attendees}`}
              </span>
            </div>

            {!compact && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
              >
                View Details
              </Button>
            )}
          </div>

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {event.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {event.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{event.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
