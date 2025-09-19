
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface CreateAnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (announcement: any) => void;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({ 
  open, 
  onClose, 
  onSubmit 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    department: '',
    priority: 'medium',
    isPinned: false,
    expiresAt: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const departments = [
    'Academic Affairs',
    'Computer Science',
    'Career Services',
    'IT Services',
    'Student Life',
    'Administration'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.department) return;

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

    onSubmit(formData);

    // Reset form
    setFormData({
      title: '',
      content: '',
      department: '',
      priority: 'medium',
      isPinned: false,
      expiresAt: ''
    });
    setLoading(false);
    
    toast({
      title: "Announcement created!",
      description: "Your announcement has been published."
    });
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Announcement</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Enter announcement title..."
              required
            />
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              placeholder="Enter announcement content..."
              className="min-h-[120px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Department</Label>
              <Select 
                value={formData.department} 
                onValueChange={(value) => setFormData({...formData, department: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData({...formData, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="expiresAt">Expires At (Optional)</Label>
            <Input
              id="expiresAt"
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPinned"
              checked={formData.isPinned}
              onCheckedChange={(checked) => setFormData({...formData, isPinned: checked as boolean})}
            />
            <Label htmlFor="isPinned">Pin this announcement</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.title.trim() || !formData.content.trim() || !formData.department || loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {loading ? 'Publishing...' : 'Publish Announcement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
