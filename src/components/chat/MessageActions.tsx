
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { editMessage, deleteMessage } from '@/services/messageService';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Edit3, Trash2, Check, X } from 'lucide-react';

interface MessageActionsProps {
  messageId: string;
  content: string;
  isOwnMessage: boolean;
  onMessageUpdated: (messageId: string, newContent: string) => void;
  onMessageDeleted: (messageId: string) => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  messageId,
  content,
  isOwnMessage,
  onMessageUpdated,
  onMessageDeleted
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleEditSave = async () => {
    if (!editContent.trim()) {
      toast({
        title: "Message cannot be empty",
        variant: "destructive"
      });
      return;
    }

    if (editContent.trim() === content.trim()) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await editMessage(messageId, editContent.trim());
      onMessageUpdated(messageId, editContent.trim());
      setIsEditing(false);
      toast({
        title: "Message updated"
      });
    } catch (error) {
      console.error('Failed to edit message:', error);
      toast({
        title: "Failed to update message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteMessage(messageId);
      onMessageDeleted(messageId);
      setShowDeleteDialog(false);
      toast({
        title: "Message deleted"
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast({
        title: "Failed to delete message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOwnMessage) {
    return null;
  }

  if (isEditing) {
    return (
      <div className="mt-2 space-y-2">
        <Textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="min-h-[60px] text-sm"
          maxLength={2000}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleEditSave();
            } else if (e.key === 'Escape') {
              handleEditCancel();
            }
          }}
        />
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={handleEditSave}
            disabled={isLoading || !editContent.trim()}
          >
            <Check className="h-3 w-3 mr-1" />
            Save
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleEditCancel}
            disabled={isLoading}
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
          <div className="text-xs text-muted-foreground ml-auto">
            {editContent.length}/2000
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Message
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Message
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
