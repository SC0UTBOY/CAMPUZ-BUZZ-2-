import React from 'react';
import RobustHashtagMentionText from './RobustHashtagMentionText';

/**
 * Quick test component to verify hashtag/mention functionality
 */
export const QuickTest: React.FC = () => {
  const testText = "Hello @john_doe! Check out this #React tutorial. #coding #webdev";

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
      <h3 className="font-semibold mb-2">Quick Test:</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Original text: "{testText}"
      </p>
      <div className="text-sm">
        <strong>Rendered:</strong> <RobustHashtagMentionText text={testText} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
        Click on the blue hashtags and mentions to test navigation!
      </p>
    </div>
  );
};

export default QuickTest;





















