
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { EventDetails, EventFormData, eventManagementService } from '@/services/eventManagementService';
import { toast } from 'sonner';

interface EditEventModalProps {
  event: EventDetails | null;
  open: boolean;
  onClose: () => void;
  onEventUpdated: () => void;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  event,
  open,
  onClose,
  onEventUpdated
}) => {
  const [formData, setFormData] = useState<Partial<EventFormData>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event && open) {
      setFormData({
        title: event.title,
        description: event.description || '',
        start_time: new Date(event.start_time).toISOString().slice(0, 16),
        end_time: new Date(event.end_time).toISOString().slice(0, 16),
        location: event.location || '',
        is_virtual: event.is_virtual,
        meeting_link: event.meeting_link || '',
        max_attendees: event.max_attendees || undefined,
        is_public: event.is_public,
        event_type: event.event_type,
        image_url: event.image_url || ''
      });
      setTags(event.tags || []);
    }
  }, [event, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    if (!formData.title || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(formData.start_time) >= new Date(formData.end_time)) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      setLoading(true);
      
      const updateData: Partial<EventFormData> = {
        ...formData,
        tags
      };

      await eventManagementService.updateEvent(event.id, updateData);
      toast.success('Event updated successfully!');
      onEventUpdated();
    } catch (error) {
      toast.error('Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter event title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your event..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time || ''}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time || ''}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="event_type">Event Type</Label>
            <Select
              value={formData.event_type || 'other'}
              onValueChange={(value) => setFormData({ ...formData, event_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="study_session">Study Session</SelectItem>
                <SelectItem value="social">Social Event</SelectItem>
                <SelectItem value="career">Career Event</SelectItem>
                <SelectItem value="academic">Academic Event</SelectItem>
                <SelectItem value="sports">Sports Event</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_virtual"
              checked={formData.is_virtual || false}
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
                value={formData.meeting_link || ''}
                onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                placeholder="https://zoom.us/j/..."
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter event location"
              />
            </div>
          )}

          <div>
            <Label htmlFor="max_attendees">Maximum Attendees (Optional)</Label>
            <Input
              id="max_attendees"
              type="number"
              min="1"
              value={formData.max_attendees || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                max_attendees: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              placeholder="Leave empty for unlimited"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_public"
              checked={formData.is_public !== false}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
            />
            <Label htmlFor="is_public">Public Event</Label>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="image_url">Event Image URL (Optional)</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url || ''}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
