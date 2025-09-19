
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageSquare, Share2, MoreHorizontal } from 'lucide-react';
import RobustHashtagMentionText from '@/components/common/RobustHashtagMentionText';
import { EnhancedLikeButton } from '@/components/posts/EnhancedLikeButton';
import { useEnhancedLikes } from '@/hooks/useEnhancedLikes';
import { EnhancedCommentsSection } from '@/components/comments/EnhancedCommentsSection';

interface PostCardProps {
  post: {
    id: string;
    author: {
      name: string;
      avatar?: string;
      major: string;
      year: string;
    };
    content: string;
    image?: string;
    timestamp: string;
    likes: number;
    comments: number;
    tags: string[];
    isLiked: boolean;
  };
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike }) => {
  const [showComments, setShowComments] = useState(false);
  const { getLikeState } = useEnhancedLikes();
  const likeState = getLikeState(post.id, post.isLiked, post.likes);

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
              <p className="text-sm text-gray-500">{post.author.major} • {post.author.year}</p>
              <p className="text-xs text-gray-400">{post.timestamp}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="mb-4">
          <div className="text-gray-800 leading-relaxed mb-3">
            <RobustHashtagMentionText text={post.content} />
          </div>
          
          {post.image && (
            <div className="rounded-lg overflow-hidden bg-gray-100">
              <img 
                src={post.image} 
                alt="Post content" 
                className="w-full h-64 object-cover"
              />
            </div>
          )}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag.replace(/\s+/g, '')}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <EnhancedLikeButton
              postId={post.id}
              initialLiked={likeState.isLiked}
              initialCount={likeState.count}
              onLike={onLike}
              size="sm"
              showCount={true}
            />
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-500"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{post.comments}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="text-gray-500">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4">
            <EnhancedCommentsSection
              postId={post.id}
              initialCommentsCount={post.comments}
              compact={false}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
