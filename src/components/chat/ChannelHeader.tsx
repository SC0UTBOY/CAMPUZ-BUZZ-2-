
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type Channel } from '@/services/chatService';
import { 
  Hash, 
  Volume2, 
  Pin, 
  Search, 
  Users, 
  Settings,
  Bell,
  BellOff,
  Star,
  MoreVertical
} from 'lucide-react';

interface ChannelHeaderProps {
  channel?: Channel;
  dmConversationId?: string;
  communityId?: string;
}

export const ChannelHeader: React.FC<ChannelHeaderProps> = ({ 
  channel, 
  dmConversationId, 
  communityId 
}) => {
  const getChannelIcon = () => {
    if (!channel) return <Hash className="h-5 w-5 text-muted-foreground" />;
    
    switch (channel.type) {
      case 'voice':
        return <Volume2 className="h-5 w-5 text-muted-foreground" />;
      case 'announcement':
        return <Pin className="h-5 w-5 text-yellow-500" />;
      default:
        return <Hash className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getHeaderTitle = () => {
    if (channel) {
      return channel.name;
    } else if (dmConversationId) {
      return 'Direct Message'; // In real app, get conversation name
    }
    return 'Select a channel';
  };

  const getHeaderDescription = () => {
    if (channel?.topic) {
      return channel.topic;
    } else if (channel?.description) {
      return channel.description;
    }
    return null;
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {getChannelIcon()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="font-semibold truncate">
                {getHeaderTitle()}
              </h1>
              {channel?.is_private && (
                <Badge variant="outline" className="text-xs">
                  Private
                </Badge>
              )}
              {channel?.slowmode_seconds && channel.slowmode_seconds > 0 && (
                <Badge variant="outline" className="text-xs">
                  Slow Mode
                </Badge>
              )}
            </div>
            {getHeaderDescription() && (
              <p className="text-sm text-muted-foreground truncate">
                {getHeaderDescription()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Pin className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Users className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Search className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Bell className="h-4 w-4 mr-2" />
                Notification Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Pin className="h-4 w-4 mr-2" />
                Pinned Messages
              </DropdownMenuItem>
              {channel && (
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Channel
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
