import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, MapPin, Users, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { eventService } from '@/services/eventService';
import { useAuth } from '@/contexts/AuthContext';

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
  communityId?: string;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  open,
  onClose,
  onEventCreated,
  communityId
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    is_virtual: false,
    meeting_link: '',
    max_attendees: '',
    event_type: 'study_session',
    is_public: true
  });
  
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);

  const eventTypes = [
    { value: 'study_session', label: 'Study Session' },
    { value: 'social', label: 'Social Event' },
    { value: 'career', label: 'Career Event' },
    { value: 'academic', label: 'Academic Event' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'networking', label: 'Networking' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title || !formData.start_time || !formData.end_time) return;

    setLoading(true);
    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location,
        is_virtual: formData.is_virtual,
        meeting_link: formData.meeting_link || undefined,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : undefined,
        event_type: formData.event_type,
        is_public: formData.is_public,
        tags: tags.length > 0 ? tags : undefined,
        created_by: user.id,
        community_id: communityId,
        attendee_count: 0
      };

      await eventService.createEvent(eventData);

      toast({
        title: "Event created!",
        description: "Your event has been created successfully."
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        is_virtual: false,
        meeting_link: '',
        max_attendees: '',
        event_type: 'study_session',
        is_public: true
      });
      setTags([]);
      setTagInput('');

      onEventCreated?.();
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Failed to create event",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter event title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your event..."
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event_type">Event Type</Label>
              <Select value={formData.event_type} onValueChange={(value) => setFormData({ ...formData, event_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="max_attendees">Max Attendees (Optional)</Label>
              <Input
                id="max_attendees"
                type="number"
                min="1"
                value={formData.max_attendees}
                onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_virtual"
              checked={formData.is_virtual}
              onCheckedChange={(checked) => setFormData({ ...formData, is_virtual: checked })}
            />
            <Label htmlFor="is_virtual">Virtual Event</Label>
          </div>

          {formData.is_virtual ? (
            <div>
              <Label htmlFor="meeting_link">Meeting Link</Label>
              <Input
                id="meeting_link"
                type="url"
                value={formData.meeting_link}
                onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                placeholder="https://meet.google.com/..."
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter event location"
              />
            </div>
          )}

          <div>
            <Label>Tags (Optional)</Label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag..."
                />
                <Button type="button" onClick={addTag} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
            />
            <Label htmlFor="is_public">Public Event</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
