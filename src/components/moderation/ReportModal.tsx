
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useModeration } from '@/hooks/useModeration';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'user';
  targetId: string;
  targetTitle?: string;
}

const REPORT_CATEGORIES = {
  spam: 'Spam or unwanted content',
  harassment: 'Harassment or bullying',
  hate_speech: 'Hate speech or discrimination',
  violence: 'Violence or threats',
  misinformation: 'False or misleading information',
  inappropriate: 'Inappropriate content',
  copyright: 'Copyright infringement',
  other: 'Other'
};

const SEVERITY_LEVELS = {
  low: 'Low - Minor issue',
  medium: 'Medium - Concerning behavior',
  high: 'High - Serious violation',
  critical: 'Critical - Immediate attention needed'
};

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle
}) => {
  const [category, setCategory] = useState<string>('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<string>('low');
  
  const { createPostReport, createUserReport, creatingPostReport, creatingUserReport } = useModeration();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !reason) return;

    const reportData = {
      category,
      reason,
      description: description || undefined,
      severity
    };

    if (targetType === 'post') {
      createPostReport({
        post_id: targetId,
        ...reportData
      });
    } else {
      createUserReport({
        reported_user_id: targetId,
        ...reportData
      });
    }

    // Reset form and close
    setCategory('');
    setReason('');
    setDescription('');
    setSeverity('low');
    onClose();
  };

  const isSubmitting = creatingPostReport || creatingUserReport;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Report {targetType === 'post' ? 'Post' : 'User'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {targetTitle && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Reporting:</p>
              <p className="font-medium text-sm line-clamp-2">{targetTitle}</p>
            </div>
          )}

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REPORT_CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="severity">Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SEVERITY_LEVELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a brief reason for this report..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="description">Additional Details (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Any additional context or details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!category || !reason || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
