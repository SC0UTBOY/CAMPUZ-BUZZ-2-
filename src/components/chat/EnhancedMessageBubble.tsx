
import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { editMessage, deleteMessage, addReaction, pinMessage, type MessageWithAuthor, type MessageAttachment } from '@/services/messageService';
import { useToast } from '@/hooks/use-toast';
import { 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Reply, 
  Pin, 
  Smile, 
  Check, 
  X,
  Download,
  Play,
  Image as ImageIcon,
  File,
  Heart,
  ThumbsUp,
  Laugh
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedMessageBubbleProps {
  message: MessageWithAuthor;
  isOwnMessage: boolean;
  showAvatar: boolean;
  onReply?: (message: MessageWithAuthor) => void;
  onMessageUpdated?: (messageId: string, newContent: string) => void;
  onMessageDeleted?: (messageId: string) => void;
}

const commonEmojis = ['👍', '❤️', '😊', '😂', '😮', '😢', '😡'];

export const EnhancedMessageBubble: React.FC<EnhancedMessageBubbleProps> = ({
  message,
  isOwnMessage,
  showAvatar,
  onReply,
  onMessageUpdated,
  onMessageDeleted
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isLoading, setIsLoading] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    
    try {
      setIsLoading(true);
      await editMessage(message.id, editContent.trim());
      onMessageUpdated?.(message.id, editContent.trim());
      setIsEditing(false);
      toast({ title: "Message updated" });
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

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await deleteMessage(message.id);
      onMessageDeleted?.(message.id);
      toast({ title: "Message deleted" });
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

  const handleReaction = async (emoji: string) => {
    if (!user) return;
    
    try {
      await addReaction(message.id, emoji, user.id);
      setShowReactions(false);
    } catch (error) {
      console.error('Failed to add reaction:', error);
      toast({
        title: "Failed to add reaction",
        variant: "destructive"
      });
    }
  };

  const handlePin = async () => {
    try {
      await pinMessage(
        message.id, 
        message.channel_id || undefined, 
        message.dm_conversation_id || undefined
      );
      toast({ title: "Message pinned" });
    } catch (error) {
      console.error('Failed to pin message:', error);
      toast({
        title: "Failed to pin message",
        variant: "destructive"
      });
    }
  };

  const renderAttachment = (attachment: MessageAttachment) => {
    const isImage = attachment.mimeType.startsWith('image/');
    const isVideo = attachment.mimeType.startsWith('video/');
    
    return (
      <div key={attachment.id} className="mt-2 p-2 border rounded-lg bg-muted/50">
        {isImage && (
          <div className="relative group">
            <img 
              src={attachment.url} 
              alt={attachment.fileName}
              className="max-w-sm max-h-64 object-cover rounded cursor-pointer"
              onClick={() => window.open(attachment.url, '_blank')}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        )}
        
        {isVideo && (
          <div className="relative group max-w-sm">
            <video 
              src={attachment.url}
              className="max-h-64 object-cover rounded"
              controls
            />
          </div>
        )}
        
        {!isImage && !isVideo && (
          <div className="flex items-center space-x-2">
            <File className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {(attachment.fileSize / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open(attachment.url, '_blank')}
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const reactions = message.reactions || {};
  const hasReactions = Object.keys(reactions).length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`group flex items-start space-x-3 p-2 hover:bg-muted/50 rounded-lg ${
        isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
      }`}
    >
      {showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.author.avatar_url} />
          <AvatarFallback>
            {message.author.display_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex-1 min-w-0 ${!showAvatar ? 'ml-11' : ''}`}>
        {showAvatar && (
          <div className="flex items-baseline space-x-2 mb-1">
            <span className="font-medium text-sm">{message.author.display_name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </span>
            {message.is_edited && (
              <Badge variant="outline" className="text-xs">edited</Badge>
            )}
          </div>
        )}
        
        <div className="space-y-1">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <Input
                ref={editInputRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEdit();
                  } else if (e.key === 'Escape') {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }
                }}
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                size="sm" 
                onClick={handleEdit} 
                disabled={isLoading || !editContent.trim()}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(message.content);
                }}
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed break-words">{message.content}</p>
            </div>
          )}
          
          {/* Render attachments */}
          {message.attachments?.map(renderAttachment)}
          
          {/* Reactions */}
          <AnimatePresence>
            {hasReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-wrap gap-1 mt-2"
              >
                {Object.entries(reactions).map(([emoji, users]) => (
                  <Button
                    key={emoji}
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleReaction(emoji)}
                  >
                    <span className="mr-1">{emoji}</span>
                    <span>{users.length}</span>
                  </Button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Message Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
        <Popover open={showReactions} onOpenChange={setShowReactions}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <Smile className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex space-x-1">
              {commonEmojis.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-lg"
                  onClick={() => handleReaction(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-6 w-6 p-0"
          onClick={() => onReply?.(message)}
        >
          <Reply className="h-3 w-3" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handlePin}>
              <Pin className="h-4 w-4 mr-2" />
              Pin Message
            </DropdownMenuItem>
            {isOwnMessage && (
              <>
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};
