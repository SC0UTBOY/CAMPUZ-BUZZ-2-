
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, X } from 'lucide-react';

interface CreatePollModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (pollData: any) => Promise<void>;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({
  open,
  onClose,
  onSubmit
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question.",
        variant: "destructive"
      });
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "Please provide at least 2 options.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        question: question.trim(),
        options: validOptions.map((opt, index) => ({
          id: index.toString(),
          text: opt.trim(),
          votes: 0,
          hasVoted: false
        })),
        allowMultiple
      });
      
      // Reset form
      setQuestion('');
      setOptions(['', '']);
      setAllowMultiple(false);
      onClose();
      
      toast({
        title: "Poll created successfully!",
        description: "Your poll is now live."
      });
    } catch (error) {
      toast({
        title: "Error creating poll",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Poll</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What's your question?"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label>Options</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {options.length < 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowMultiple"
              checked={allowMultiple}
              onCheckedChange={(checked) => setAllowMultiple(checked === true)}
            />
            <Label htmlFor="allowMultiple" className="text-sm">
              Allow multiple selections
            </Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Poll'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
