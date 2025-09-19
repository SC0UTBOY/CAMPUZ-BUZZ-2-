
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit, Trash2, Pin, Flag, Copy, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PostActionsProps {
  postId: string;
  isOwnPost: boolean;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
  onPin?: (postId: string) => void;
  onReport?: (postId: string) => void;
  className?: string;
}

export const PostActions: React.FC<PostActionsProps> = ({
  postId,
  isOwnPost,
  onEdit,
  onDelete,
  onPin,
  onReport,
  className = ''
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(postUrl);
    toast({
      title: "Link copied",
      description: "Post link has been copied to clipboard"
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this post',
        url: `${window.location.origin}/post/${postId}`
      });
    } else {
      handleCopyLink();
    }
  };

  const handleDelete = () => {
    onDelete(postId);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${className}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {isOwnPost ? (
            <>
              <DropdownMenuItem onClick={() => onEdit(postId)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit post
              </DropdownMenuItem>
              {onPin && (
                <DropdownMenuItem onClick={() => onPin(postId)}>
                  <Pin className="h-4 w-4 mr-2" />
                  Pin post
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete post
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              {onReport && (
                <DropdownMenuItem 
                  onClick={() => onReport(postId)}
                  className="text-destructive focus:text-destructive"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Report post
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post and remove it from all feeds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
