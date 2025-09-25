
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { fixedChatService, type MessageWithAuthor, type RoomWithDetails } from '@/services/fixedChatService';
import { Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInterfaceProps {
  room: RoomWithDetails;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ room }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithAuthor[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadMessages();
    
    const unsubscribeMessages = fixedChatService.subscribeToMessages(
      room.id,
      (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
      }
    );

    // Mark messages as read when entering the room
    fixedChatService.markAsRead(room.id);

    // Note: Typing indicators will be implemented later
    const unsubscribeTyping = () => {};

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
      handleStopTyping();
    };
  }, [room.id, user?.email]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const data = await fixedChatService.getRoomMessages(room.id);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !user) return;

    try {
      await fixedChatService.sendMessage(room.id, messageInput.trim());
      setMessageInput('');
      handleStopTyping();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = async () => {
    if (!isTyping) {
      setIsTyping(true);
      // Typing indicators will be implemented later
      // await fixedChatService.startTyping(room.id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 3000);
  };

  const handleStopTyping = async () => {
    if (isTyping) {
      setIsTyping(false);
      // Typing indicators will be implemented later
      // await fixedChatService.stopTyping(room.id);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{room.name}</h2>
            {room.description && (
              <p className="text-sm text-muted-foreground">{room.description}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-0">
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.user_id === user?.id}
                showAvatar={index === 0 || messages[index - 1].user_id !== message.user_id}
              />
            ))}
          </AnimatePresence>
          
          {typingUsers.length > 0 && (
            <TypingIndicator users={typingUsers} />
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              handleTyping();
            }}
            onBlur={handleStopTyping}
            placeholder={`Message ${room.name}...`}
            className="flex-1"
            maxLength={1000}
          />
          <Button 
            type="submit" 
            disabled={!messageInput.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
