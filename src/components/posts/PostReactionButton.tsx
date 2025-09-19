
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Heart, Smile, ThumbsUp, Angry, Frown, AlertCircle } from 'lucide-react';

interface PostReactionButtonProps {
  reactions: Record<string, { count: number; users: string[] }>;
  userReaction?: string;
  onReact: (reactionType: string) => void;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const reactionIcons = {
  like: { icon: ThumbsUp, color: 'text-blue-500', label: 'Like' },
  love: { icon: Heart, color: 'text-red-500', label: 'Love' },
  laugh: { icon: Smile, color: 'text-yellow-500', label: 'Laugh' },
  wow: { icon: AlertCircle, color: 'text-purple-500', label: 'Wow' },
  sad: { icon: Frown, color: 'text-gray-500', label: 'Sad' },
  angry: { icon: Angry, color: 'text-orange-500', label: 'Angry' }
};

export const PostReactionButton: React.FC<PostReactionButtonProps> = ({
  reactions,
  userReaction,
  onReact,
  size = 'default'
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const totalReactions = Object.values(reactions).reduce((sum, reaction) => sum + reaction.count, 0);
  
  const currentReactionIcon = userReaction ? reactionIcons[userReaction as keyof typeof reactionIcons] : null;
  const CurrentIcon = currentReactionIcon?.icon || ThumbsUp;

  const handleReactionClick = (reactionType: string) => {
    onReact(reactionType);
    setShowPicker(false);
  };

  const handleQuickReaction = () => {
    if (userReaction) {
      // Remove current reaction
      onReact(userReaction);
    } else {
      // Quick like
      onReact('like');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size={size}
            onClick={handleQuickReaction}
            className={`flex items-center space-x-1 ${
              userReaction ? currentReactionIcon?.color : 'text-muted-foreground'
            } hover:bg-muted/50`}
            onMouseEnter={() => setShowPicker(true)}
            onMouseLeave={() => setTimeout(() => setShowPicker(false), 200)}
          >
            <CurrentIcon className={`h-4 w-4 ${userReaction ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{totalReactions || ''}</span>
          </Button>
          
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="px-1 text-muted-foreground hover:bg-muted/50"
            >
              <span className="text-xs">▼</span>
            </Button>
          </PopoverTrigger>
        </div>

        <PopoverContent
          className="w-auto p-2"
          side="top"
          align="start"
          onMouseEnter={() => setShowPicker(true)}
          onMouseLeave={() => setShowPicker(false)}
        >
          <div className="flex space-x-1">
            {Object.entries(reactionIcons).map(([type, { icon: Icon, color, label }]) => (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                onClick={() => handleReactionClick(type)}
                className={`p-2 hover:bg-muted rounded-full transition-all duration-200 hover:scale-110 ${
                  userReaction === type ? 'bg-muted' : ''
                }`}
                title={label}
              >
                <Icon className={`h-5 w-5 ${color}`} />
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Show reaction breakdown */}
      {totalReactions > 0 && (
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          {Object.entries(reactions)
            .filter(([_, reaction]) => reaction.count > 0)
            .slice(0, 3)
            .map(([type, reaction]) => {
              const reactionConfig = reactionIcons[type as keyof typeof reactionIcons];
              if (!reactionConfig) return null;
              
              const Icon = reactionConfig.icon;
              return (
                <div key={type} className="flex items-center space-x-1">
                  <Icon className={`h-3 w-3 ${reactionConfig.color}`} />
                  <span>{reaction.count}</span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};
