import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RobustHashtagMentionText from './RobustHashtagMentionText';

/**
 * Test component to verify hashtag and mention detection is working
 */
export const HashtagMentionTest: React.FC = () => {
  const testTexts = [
    "Check out this amazing #React tutorial by @johndoe! #coding #webdev",
    "Just finished reading @jane_smith's post about #TypeScript. Great insights! #programming",
    "Meeting @alex_chen tomorrow to discuss #project_alpha. Excited! #collaboration",
    "Thanks @mentor_sarah for the guidance on #career_development. #grateful #learning",
    "Edge cases: #123 @user123 #test_with_underscores @user_with_underscores",
    "Special chars: #test@invalid @user#invalid #valid @valid",
    "Empty and single: # @ #a @b",
    "Multiple spaces:   #spaced   @spaced   normal   text"
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Hashtag & Mention Test</CardTitle>
        <p className="text-sm text-muted-foreground">
          Click on the blue hashtags (#example) and mentions (@username) to test the functionality
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {testTexts.map((text, index) => (
          <div key={index} className="p-4 border rounded-lg bg-muted/30">
            <RobustHashtagMentionText text={text} />
          </div>
        ))}
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Expected Behavior:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>Hashtags</strong> (#React, #coding, etc.) should be blue and clickable</li>
            <li>• <strong>Mentions</strong> (@johndoe, @jane_smith, etc.) should be blue and clickable</li>
            <li>• <strong>Hover</strong> should show underline and cursor pointer</li>
            <li>• <strong>Click hashtags</strong> should navigate to /hashtag/[hashtag]</li>
            <li>• <strong>Click mentions</strong> should navigate to /profile/[username]</li>
            <li>• <strong>Normal text</strong> should remain unchanged</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default HashtagMentionTest;
