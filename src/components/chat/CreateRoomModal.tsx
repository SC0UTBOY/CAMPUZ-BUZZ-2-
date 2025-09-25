
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { fixedChatService } from '@/services/fixedChatService';
import { useToast } from '@/hooks/use-toast';

interface CreateRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomCreated: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  open,
  onOpenChange,
  onRoomCreated
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      await fixedChatService.createRoom(name.trim(), description.trim(), isPrivate);
      
      toast({
        title: "Room created!",
        description: `Successfully created "${name}"`
      });
      
      setName('');
      setDescription('');
      setIsPrivate(false);
      onOpenChange(false);
      onRoomCreated();
    } catch (error) {
      console.error('Failed to create room:', error);
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Chat Room</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Room Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter room name..."
              maxLength={100}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this room about?"
              maxLength={500}
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
            <Label htmlFor="private">Private room</Label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? 'Creating...' : 'Create Room'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
