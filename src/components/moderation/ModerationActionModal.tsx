
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useModeration } from '@/hooks/useModeration';

interface ModerationActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any;
}

const ACTION_TYPES = {
  warn: 'Issue Warning',
  mute: 'Mute User',
  ban: 'Ban User',
  suspend: 'Suspend User',
  remove_content: 'Remove Content'
};

export const ModerationActionModal: React.FC<ModerationActionModalProps> = ({
  isOpen,
  onClose,
  report
}) => {
  const [actionType, setActionType] = useState<string>('');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  
  const { takeModerationAction, takingAction } = useModeration();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!actionType || !reason || !report) return;

    takeModerationAction({
      target_type: report.type === 'post' ? 'post' : 'user',
      target_id: report.type === 'post' ? report.post_id : report.reported_user_id,
      action_type: actionType as any,
      reason,
      duration: duration || undefined,
      notes: notes || undefined
    });

    // Reset form and close
    setActionType('');
    setReason('');
    setDuration('');
    setNotes('');
    onClose();
  };

  const needsDuration = ['mute', 'ban', 'suspend'].includes(actionType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Take Moderation Action</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {report && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Taking action on:</p>
              <p className="font-medium text-sm">
                {report.reason} ({report.category})
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="actionType">Action Type</Label>
            <Select value={actionType} onValueChange={setActionType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select an action" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACTION_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsDuration && (
            <div>
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="24"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                max="8760"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for permanent action
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Explain the reason for this action..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">Internal Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes for other moderators..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!actionType || !reason || takingAction}
            >
              {takingAction ? 'Taking Action...' : 'Take Action'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
