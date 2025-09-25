
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { chatService, type CommunityWithChannels, type Channel } from '@/services/chatService';
import { 
  Hash, 
  Volume2, 
  Plus, 
  Settings, 
  UserPlus,
  Crown,
  Shield,
  Users,
  Lock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChannelSidebarProps {
  community: CommunityWithChannels;
  activeChannelId?: string;
  onChannelSelect: (channel: Channel) => void;
  onCreateChannel?: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  community,
  activeChannelId,
  onChannelSelect,
  onCreateChannel
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['text', 'voice']));
  const [searchQuery, setSearchQuery] = useState('');

  const textChannels = community.channels.filter(c => c.type === 'text');
  const voiceChannels = community.channels.filter(c => c.type === 'voice');
  const announcementChannels = community.channels.filter(c => c.type === 'announcement');

  const filteredTextChannels = textChannels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredVoiceChannels = voiceChannels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'Moderator':
        return <Shield className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-60 bg-muted/30 border-r flex flex-col h-full">
      {/* Community Header */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={community.avatar_url || ''} />
            <AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{community.name}</h2>
            <p className="text-sm text-muted-foreground">
              {community.member_count} members
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite People
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Server Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <Input
          placeholder="Search channels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {/* Announcement Channels */}
          {announcementChannels.length > 0 && (
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                onClick={() => toggleSection('announcements')}
              >
                {expandedSections.has('announcements') ? 
                  <ChevronDown className="h-3 w-3 mr-1" /> : 
                  <ChevronRight className="h-3 w-3 mr-1" />
                }
                Announcements
              </Button>
              <AnimatePresence>
                {expandedSections.has('announcements') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-1"
                  >
                    {announcementChannels.map(channel => (
                      <Button
                        key={channel.id}
                        variant={activeChannelId === channel.id ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start h-8"
                        onClick={() => onChannelSelect(channel)}
                      >
                        <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="truncate">{channel.name}</span>
                        {channel.is_private && (
                          <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
                        )}
                      </Button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Text Channels */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start h-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                onClick={() => toggleSection('text')}
              >
                {expandedSections.has('text') ? 
                  <ChevronDown className="h-3 w-3 mr-1" /> : 
                  <ChevronRight className="h-3 w-3 mr-1" />
                }
                Text Channels
              </Button>
              {onCreateChannel && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={onCreateChannel}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
            <AnimatePresence>
              {expandedSections.has('text') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1"
                >
                  {filteredTextChannels.map(channel => (
                    <Button
                      key={channel.id}
                      variant={activeChannelId === channel.id ? 'secondary' : 'ghost'}
                      size="sm"
                      className="w-full justify-start h-8 group"
                      onClick={() => onChannelSelect(channel)}
                    >
                      <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="truncate flex-1">{channel.name}</span>
                      {channel.is_private && (
                        <Lock className="h-3 w-3 ml-1 text-muted-foreground" />
                      )}
                      <Badge variant="secondary" className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        12
                      </Badge>
                    </Button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Voice Channels */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              onClick={() => toggleSection('voice')}
            >
              {expandedSections.has('voice') ? 
                <ChevronDown className="h-3 w-3 mr-1" /> : 
                <ChevronRight className="h-3 w-3 mr-1" />
              }
              Voice Channels
            </Button>
            <AnimatePresence>
              {expandedSections.has('voice') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1"
                >
                  {filteredVoiceChannels.map(channel => (
                    <Button
                      key={channel.id}
                      variant={activeChannelId === channel.id ? 'secondary' : 'ghost'}
                      size="sm"
                      className="w-full justify-start h-8"
                      onClick={() => onChannelSelect(channel)}
                    >
                      <Volume2 className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="truncate">{channel.name}</span>
                      {channel.is_private && (
                        <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
                      )}
                    </Button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </ScrollArea>

      {/* Member List Preview */}
      <div className="p-3 border-t">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Members
          </span>
          <Badge variant="secondary" className="text-xs">
            {community.member_count}
          </Badge>
        </div>
        <div className="space-y-1">
          {/* Online members preview */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">5 Online</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-sm text-muted-foreground">12 Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
};
