
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserPosts } from '@/hooks/useUserPosts';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Heart, Image, Video, FileText } from 'lucide-react';

interface UserPostsTabProps {
  userId?: string;
}

export const UserPostsTab: React.FC<UserPostsTabProps> = ({ userId }) => {
  const { posts, loading, error } = useUserPosts(userId);

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Failed to load posts: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No posts yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getPostTypeIcon(post.post_type)}
                <span className="font-medium">
                  {post.title || 'Untitled Post'}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {post.visibility}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-3 line-clamp-3">
              {post.content}
            </p>
            {post.image_url && (
              <img 
                src={post.image_url} 
                alt="Post content" 
                className="w-full h-48 object-cover rounded-md mb-3"
              />
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{post.likes_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{post.comments_count}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
