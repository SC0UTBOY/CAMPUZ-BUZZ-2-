
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CreateStudyGroupModalProps {
  open: boolean;
  onClose: () => void;
  onGroupCreated?: () => void;
}

export const CreateStudyGroupModal: React.FC<CreateStudyGroupModalProps> = ({ 
  open, 
  onClose, 
  onGroupCreated
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: '',
    maxMembers: 10,
    schedule: '',
    difficulty: 'Intermediate'
  });
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const subjects = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Business',
    'Psychology',
    'Engineering',
    'English',
    'History'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.subject || !formData.description.trim() || !user) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('study_groups')
        .insert({
          name: formData.name,
          subject: formData.subject,
          description: formData.description,
          max_members: formData.maxMembers,
          tags: topics,
          created_by: user.id,
          meeting_schedule: formData.schedule ? { schedule: formData.schedule } : null
        });

      if (error) throw error;

      // Reset form
      setFormData({
        name: '',
        subject: '',
        description: '',
        maxMembers: 10,
        schedule: '',
        difficulty: 'Intermediate'
      });
      setTopics([]);
      setTopicInput('');
      
      toast({
        title: "Study group created!",
        description: "Your study group has been created successfully."
      });
      
      onGroupCreated?.();
      onClose();
    } catch (error) {
      console.error('Error creating study group:', error);
      toast({
        title: "Failed to create group",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTopic = () => {
    if (topicInput.trim() && !topics.includes(topicInput.trim())) {
      setTopics([...topics, topicInput.trim()]);
      setTopicInput('');
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setTopics(topics.filter(topic => topic !== topicToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Study Group</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Advanced Calculus Study Group"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Subject</Label>
              <Select 
                value={formData.subject} 
                onValueChange={(value) => setFormData({...formData, subject: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Difficulty Level</Label>
              <Select 
                value={formData.difficulty} 
                onValueChange={(value) => setFormData({...formData, difficulty: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe what your study group will cover..."
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxMembers">Max Members</Label>
              <Input
                id="maxMembers"
                type="number"
                min="2"
                max="50"
                value={formData.maxMembers}
                onChange={(e) => setFormData({...formData, maxMembers: parseInt(e.target.value)})}
              />
            </div>

            <div>
              <Label htmlFor="schedule">Schedule</Label>
              <Input
                id="schedule"
                value={formData.schedule}
                onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                placeholder="e.g., Tuesdays 3-5 PM"
              />
            </div>
          </div>

          <div>
            <Label>Topics (Optional)</Label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="Add a topic..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                />
                <Button type="button" onClick={addTopic} variant="outline">
                  Add
                </Button>
              </div>
              
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="flex items-center space-x-1">
                      <span>{topic}</span>
                      <button
                        type="button"
                        onClick={() => removeTopic(topic)}
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.name.trim() || !formData.subject || !formData.description.trim() || loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
