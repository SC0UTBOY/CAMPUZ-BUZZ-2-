import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PostText } from '@/components/common/ParsedText';
import { Heart, MessageSquare, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SocialPost {
  id: string;
  author: {
    name: string;
    username: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
}

interface SocialFeedExampleProps {
  posts: SocialPost[];
}

/**
 * Example social feed component showing hashtag and mention detection
 * This demonstrates how to use the PostText component in your feed
 */
export const SocialFeedExample: React.FC<SocialFeedExampleProps> = ({ posts }) => {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {posts.map((post) => (
        <Card key={post.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author.avatar} />
                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground">{post.author.name}</h3>
                <p className="text-sm text-muted-foreground">@{post.author.username} • {post.timestamp}</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* This is where the magic happens - PostText automatically detects and styles hashtags and mentions */}
            <div className="mb-4">
              <PostText content={post.content} />
            </div>
            
            {/* Post actions */}
            <div className="flex items-center space-x-4 pt-3 border-t">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
                <Heart className="h-4 w-4 mr-1" />
                {post.likes}
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-500">
                <MessageSquare className="h-4 w-4 mr-1" />
                {post.comments}
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-green-500">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Example usage with sample data
export const SocialFeedDemo: React.FC = () => {
  const samplePosts: SocialPost[] = [
    {
      id: '1',
      author: {
        name: 'John Doe',
        username: 'johndoe',
        avatar: undefined
      },
      content: 'Just finished an amazing #React tutorial! Thanks @jane_smith for the recommendation. #coding #webdev #learning',
      timestamp: '2h',
      likes: 12,
      comments: 3
    },
    {
      id: '2',
      author: {
        name: 'Sarah Wilson',
        username: 'sarahw',
        avatar: undefined
      },
      content: 'Excited to announce our new #TypeScript course! Join @alex_chen and me for this amazing journey. #programming #education',
      timestamp: '4h',
      likes: 28,
      comments: 7
    },
    {
      id: '3',
      author: {
        name: 'Mike Johnson',
        username: 'mikej',
        avatar: undefined
      },
      content: 'Working on a new project with @team_alpha. The #AI integration is going smoothly! #tech #innovation #collaboration',
      timestamp: '6h',
      likes: 15,
      comments: 2
    }
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Social Feed with Hashtag & Mention Detection</h2>
      <SocialFeedExample posts={samplePosts} />
      
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          How it works:
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Hashtags</strong> (#example) automatically become clickable blue links</li>
          <li>• <strong>Mentions</strong> (@username) automatically become clickable blue links</li>
          <li>• <strong>Hover effects</strong> show underline and cursor pointer</li>
          <li>• <strong>Click hashtags</strong> to go to /hashtag/example</li>
          <li>• <strong>Click mentions</strong> to go to /profile/username</li>
          <li>• <strong>Normal text</strong> remains unchanged</li>
        </ul>
      </div>
    </div>
  );
};





















