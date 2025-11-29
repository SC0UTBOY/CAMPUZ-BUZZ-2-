import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RobustHashtagMentionText from './RobustHashtagMentionText';

/**
 * Demo component showing hashtag and mention functionality
 */
export const HashtagMentionDemo: React.FC = () => {
  const demoPosts = [
    {
      id: '1',
      author: 'John Doe',
      content: 'Just learned about #React hooks! Thanks @sarah_dev for the amazing tutorial. #coding #webdev #learning',
      timestamp: '2 hours ago'
    },
    {
      id: '2', 
      author: 'Sarah Wilson',
      content: 'Working on a new #TypeScript project with @alex_coder. The type safety is incredible! #programming #collaboration',
      timestamp: '4 hours ago'
    },
    {
      id: '3',
      author: 'Alex Chen',
      content: 'Excited to announce our new #startup! Thanks to @mentor_mike and @advisor_jane for their support. #entrepreneurship #grateful',
      timestamp: '6 hours ago'
    }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Hashtag & Mention Demo
            <Badge variant="secondary">Live Demo</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Click on the blue hashtags (#example) and mentions (@username) to test the functionality
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {demoPosts.map((post) => (
            <Card key={post.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {post.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{post.author}</p>
                    <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                  </div>
                </div>
                <div className="text-sm leading-relaxed">
                  <RobustHashtagMentionText text={post.content} />
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
            ✅ Features Working:
          </h4>
          <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
            <li>• <strong>Hashtags</strong> are blue and clickable → /hashtag/[hashtag]</li>
            <li>• <strong>Mentions</strong> are blue and clickable → /profile/[username]</li>
            <li>• <strong>Hover effects</strong> with underline and cursor pointer</li>
            <li>• <strong>Normal text</strong> remains unchanged</li>
            <li>• <strong>No React errors</strong> - all text properly wrapped</li>
            <li>• <strong>Keyboard accessible</strong> - Tab + Enter/Space</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default HashtagMentionDemo;





















