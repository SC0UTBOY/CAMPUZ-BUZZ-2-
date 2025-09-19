import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Database, Users, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Test component to verify comment schema and foreign key relationships
 */
export const CommentSchemaTest: React.FC = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<{
    foreignKeys: boolean;
    commentCreation: boolean;
    commentRetrieval: boolean;
    profileJoin: boolean;
    error?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runSchemaTests = async () => {
    if (!user) {
      setTestResults({
        foreignKeys: false,
        commentCreation: false,
        commentRetrieval: false,
        profileJoin: false,
        error: 'User not authenticated'
      });
      return;
    }

    setIsLoading(true);
    setTestResults(null);

    try {
      // Test 1: Check if foreign key constraints exist
      const { data: constraints, error: constraintError } = await supabase
        .from('information_schema.table_constraints')
        .select('constraint_name, constraint_type')
        .eq('table_name', 'comments')
        .in('constraint_type', ['FOREIGN KEY']);

      if (constraintError) throw constraintError;

      const hasForeignKeys = constraints && constraints.length > 0;

      // Test 2: Create a test post
      const { data: testPost, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: 'Test post for comment schema validation',
          title: 'Schema Test Post'
        })
        .select()
        .single();

      if (postError) throw postError;

      // Test 3: Create a test comment
      const { data: testComment, error: commentError } = await supabase
        .from('comments')
        .insert({
          post_id: testPost.id,
          user_id: user.id,
          content: 'Test comment to verify foreign key relationships',
          depth: 0
        })
        .select()
        .single();

      if (commentError) throw commentError;

      // Test 4: Retrieve comment with profile join
      const { data: commentWithProfile, error: joinError } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          profiles!inner (
            id,
            user_id,
            display_name,
            avatar_url
          )
        `)
        .eq('id', testComment.id)
        .single();

      if (joinError) throw joinError;

      // Test 5: Clean up test data
      await supabase.from('comments').delete().eq('id', testComment.id);
      await supabase.from('posts').delete().eq('id', testPost.id);

      setTestResults({
        foreignKeys: hasForeignKeys,
        commentCreation: true,
        commentRetrieval: true,
        profileJoin: !!commentWithProfile.profiles
      });

    } catch (error: any) {
      console.error('Schema test error:', error);
      setTestResults({
        foreignKeys: false,
        commentCreation: false,
        commentRetrieval: false,
        profileJoin: false,
        error: error.message || 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? "default" : "destructive"}>
        {status ? "PASS" : "FAIL"}
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Comment Schema & Foreign Key Test
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This test verifies that the comment system has proper foreign key relationships
            and can successfully create, retrieve, and join data with user profiles.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runSchemaTests} 
            disabled={isLoading || !user}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Schema Tests'
            )}
          </Button>

          {!user && (
            <div className="text-center py-4 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Please log in to run the schema tests</p>
            </div>
          )}

          {testResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.foreignKeys)}
                    <span className="font-medium">Foreign Key Constraints</span>
                  </div>
                  {getStatusBadge(testResults.foreignKeys)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.commentCreation)}
                    <span className="font-medium">Comment Creation</span>
                  </div>
                  {getStatusBadge(testResults.commentCreation)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.commentRetrieval)}
                    <span className="font-medium">Comment Retrieval</span>
                  </div>
                  {getStatusBadge(testResults.commentRetrieval)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.profileJoin)}
                    <span className="font-medium">Profile Join</span>
                  </div>
                  {getStatusBadge(testResults.profileJoin)}
                </div>
              </div>

              {testResults.error && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Error Details:</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">{testResults.error}</p>
                </div>
              )}

              {testResults.foreignKeys && testResults.commentCreation && 
               testResults.commentRetrieval && testResults.profileJoin && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-800 dark:text-green-200">
                      All Tests Passed!
                    </h4>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    The comment system is properly configured with foreign key relationships
                    and can successfully interact with the database.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">What This Test Checks:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Foreign Key Constraints:</strong> Verifies that comments table has proper foreign key relationships</li>
              <li>• <strong>Comment Creation:</strong> Tests creating a new comment with proper user and post references</li>
              <li>• <strong>Comment Retrieval:</strong> Tests fetching comments from the database</li>
              <li>• <strong>Profile Join:</strong> Tests joining comments with user profiles using foreign key relationships</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommentSchemaTest;
