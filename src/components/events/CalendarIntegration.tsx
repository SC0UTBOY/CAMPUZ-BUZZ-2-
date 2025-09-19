
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ExternalLink, Download } from 'lucide-react';
import { Event, eventService } from '@/services/eventService';
import { toast } from 'sonner';

interface CalendarIntegrationProps {
  event: Event;
  size?: 'sm' | 'default' | 'lg';
}

export const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({
  event,
  size = 'default'
}) => {
  const handleAddToGoogleCalendar = () => {
    try {
      const googleCalendarUrl = eventService.generateGoogleCalendarLink(event);
      window.open(googleCalendarUrl, '_blank');
      toast.success('Opening Google Calendar...');
    } catch (error) {
      toast.error('Failed to generate calendar link');
    }
  };

  const handleAddToOutlook = () => {
    try {
      const outlookUrl = eventService.generateOutlookCalendarLink(event);
      window.open(outlookUrl, '_blank');
      toast.success('Opening Outlook...');
    } catch (error) {
      toast.error('Failed to generate calendar link');
    }
  };

  const handleDownloadICS = () => {
    try {
      const startDate = new Date(event.start_time);
      const endDate = new Date(event.end_time);
      
      // Format dates for ICS (YYYYMMDDTHHMMSSZ)
      const formatICSDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//StudyHub//Event//EN',
        'BEGIN:VEVENT',
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description || ''}`,
        `LOCATION:${event.location || ''}`,
        `UID:${event.id}@studyhub.app`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

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
    } catch (error) {
      toast.error('Failed to download calendar file');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4" />
        <span className="text-sm font-medium">Add to Calendar</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size={size}
          onClick={handleAddToGoogleCalendar}
          className="flex items-center space-x-2"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Google</span>
        </Button>
        
        <Button
          variant="outline"
          size={size}
          onClick={handleAddToOutlook}
          className="flex items-center space-x-2"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Outlook</span>
        </Button>
        
        <Button
          variant="outline"
          size={size}
          onClick={handleDownloadICS}
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Download</span>
        </Button>
      </div>
      
      <Badge variant="secondary" className="text-xs">
        Sync with your favorite calendar app
      </Badge>
    </div>
  );
};
