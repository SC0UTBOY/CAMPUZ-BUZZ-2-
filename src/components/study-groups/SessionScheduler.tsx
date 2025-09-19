
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SessionSchedulerProps {
  open: boolean;
  onClose: () => void;
  studyGroupId: string;
  onSessionCreated?: () => void;
}

export const SessionScheduler: React.FC<SessionSchedulerProps> = ({
  open,
  onClose,
  studyGroupId,
  onSessionCreated
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration_minutes: 60,
    location: '',
    meeting_link: '',
    is_virtual: false,
    max_participants: ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title || !formData.scheduled_at) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('study_sessions')
        .insert({
          study_group_id: studyGroupId,
          title: formData.title,
          description: formData.description,
          scheduled_at: formData.scheduled_at,
          duration_minutes: formData.duration_minutes,
          location: formData.is_virtual ? null : formData.location,
          meeting_link: formData.is_virtual ? formData.meeting_link : null,
          is_virtual: formData.is_virtual,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Session scheduled!",
        description: "Your study session has been scheduled successfully."
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        scheduled_at: '',
        duration_minutes: 60,
        location: '',
        meeting_link: '',
        is_virtual: false,
        max_participants: ''
      });

      onSessionCreated?.();
      onClose();
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Failed to schedule session",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Study Session</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Session Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Calculus Problem Solving"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What will you cover in this session?"
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduled_at">Date & Time</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input
                id="duration_minutes"
                type="number"
                min="15"
                max="480"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_virtual"
              checked={formData.is_virtual}
              onCheckedChange={(checked) => setFormData({ ...formData, is_virtual: checked })}
            />
            <Label htmlFor="is_virtual" className="flex items-center space-x-2">
              <Video className="h-4 w-4" />
              <span>Virtual Session</span>
            </Label>
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
                placeholder="Library Room 201, Campus Center, etc."
              />
            </div>
          )}

          <div>
            <Label htmlFor="max_participants">Max Participants (Optional)</Label>
            <Input
              id="max_participants"
              type="number"
              min="1"
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
              placeholder="Leave empty for unlimited"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Session Preview</span>
            </div>
            <div className="space-y-1 text-sm text-blue-700">
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3" />
                <span>
                  {formData.scheduled_at 
                    ? new Date(formData.scheduled_at).toLocaleString()
                    : 'Please select date and time'
                  }
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {formData.is_virtual ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                <span>
                  {formData.is_virtual ? 'Virtual Meeting' : formData.location || 'Location TBD'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-3 w-3" />
                <span>
                  {formData.max_participants 
                    ? `Max ${formData.max_participants} participants`
                    : 'Unlimited participants'
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
