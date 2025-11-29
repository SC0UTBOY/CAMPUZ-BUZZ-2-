import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const DatabaseSchemaTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runSchemaTest = async () => {
    setLoading(true);
    try {
      const results: any = {};

      // Test 1: Check if comment_likes table exists
      try {
        const { data, error } = await supabase
          .from('comment_likes')
          .select('*')
          .limit(1);
        
        results.commentLikesTable = { 
          exists: !error, 
          error: error?.message,
          data: data 
        };
      } catch (error) {
        results.commentLikesTable = { 
          exists: false, 
          error: error.message 
        };
      }

      // Test 2: Check if replies table exists
      try {
        const { data, error } = await supabase
          .from('replies')
          .select('*')
          .limit(1);
        
        results.repliesTable = { 
          exists: !error, 
          error: error?.message,
          data: data 
        };
      } catch (error) {
        results.repliesTable = { 
          exists: false, 
          error: error.message 
        };
      }

      // Test 3: Check if comments table has new columns
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('id, like_count, reply_count')
          .limit(1);
        
        results.commentsColumns = { 
          hasNewColumns: !error, 
          error: error?.message,
          data: data 
        };
      } catch (error) {
        results.commentsColumns = { 
          hasNewColumns: false, 
          error: error.message 
        };
      }

      // Test 4: Check table structure
      try {
        const { data, error } = await supabase
          .rpc('get_table_info', { table_name: 'comment_likes' });
        
        results.commentLikesStructure = { 
          success: !error, 
          error: error?.message,
          data: data 
        };
      } catch (error) {
        results.commentLikesStructure = { 
          success: false, 
          error: error.message 
        };
      }

      setTestResults(results);
    } catch (error) {
      setTestResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4">Database Schema Test</h3>
      
      <button
        onClick={runSchemaTest}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Database Schema'}
      </button>

      {testResults && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Schema Test Results:</h4>
          <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          ⚠️ Database Setup Required
        </h4>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
          If the tables don't exist, you need to run the SQL script first:
        </p>
        <ol className="text-sm text-yellow-700 dark:text-yellow-300 list-decimal list-inside space-y-1">
          <li>Go to your Supabase Dashboard</li>
          <li>Open the SQL Editor</li>
          <li>Copy and paste the contents of <code>apply-comment-likes-replies.sql</code></li>
          <li>Run the script</li>
          <li>Come back and test again</li>
        </ol>
      </div>
    </div>
  );
};





















