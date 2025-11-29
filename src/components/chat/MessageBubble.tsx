
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatMessageTimestamp } from '@/utils/chatUtils';
import { type MessageWithAuthor } from '@/services/realtimeChatService';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
  message: MessageWithAuthor;
  isOwnMessage: boolean;
  showAvatar?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isOwnMessage, 
  showAvatar = true 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start space-x-3 px-4 py-2 hover:bg-muted/30 ${
        isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
      }`}
    >
      {showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.author.avatar_url} />
          <AvatarFallback>
            {message.author.display_name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex-1 min-w-0 ${isOwnMessage ? 'text-right' : ''}`}>
        {showAvatar && (
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-sm">
              {message.author.display_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatMessageTimestamp(message.created_at)}
            </span>
            {message.edited_at && (
              <Badge variant="secondary" className="text-xs">
                edited
              </Badge>
            )}
          </div>
        )}
        
        <div className={`rounded-lg px-3 py-2 max-w-lg break-words ${
          isOwnMessage 
            ? 'bg-primary text-primary-foreground ml-auto' 
            : 'bg-muted'
        }`}>
          {message.reply_to && (
            <div className="text-xs opacity-70 mb-1 pl-2 border-l-2 border-current">
              Replying to previous message
            </div>
          )}
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    </motion.div>
  );
};
