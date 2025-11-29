import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PostText } from './ParsedText';

/**
 * Demo component to showcase hashtag and mention highlighting
 * This can be used for testing the text parser functionality
 */
export const TextParserDemo: React.FC = () => {
  const sampleTexts = [
    "Check out this amazing #React tutorial by @john_doe! #coding #webdev",
    "Just finished reading @jane_smith's post about #TypeScript. Great insights! #programming",
    "Meeting @alex_chen tomorrow to discuss #project_alpha. Excited! #collaboration",
    "Thanks @mentor_sarah for the guidance on #career_development. #grateful #learning"
  ];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Hashtag & Mention Demo</CardTitle>
        <p className="text-sm text-muted-foreground">
          Click on hashtags (#example) and mentions (@username) to see them in action!
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sampleTexts.map((text, index) => (
          <div key={index} className="p-4 border rounded-lg bg-muted/30">
            <PostText content={text} />
          </div>
        ))}
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Features:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Hashtags (#example) link to /hashtag/example</li>
            <li>• Mentions (@username) link to /user/username</li>
            <li>• Twitter-like blue styling with hover effects</li>
            <li>• Keyboard accessible (Tab + Enter/Space)</li>
            <li>• Works in both light and dark modes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};





















