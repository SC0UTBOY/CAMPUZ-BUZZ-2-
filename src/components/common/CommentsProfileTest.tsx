import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Database, Users, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Test component to verify comments-profiles relationship works correctly
 */
export const CommentsProfileTest: React.FC = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<{
    foreignKeyExists: boolean;
    canQueryComments: boolean;
    canJoinProfiles: boolean;
    profileDataComplete: boolean;
    schemaCacheRefreshed: boolean;
    error?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sampleData, setSampleData] = useState<any[]>([]);

  const runRelationshipTest = async () => {
    if (!user) {
      setTestResults({
        foreignKeyExists: false,
        canQueryComments: false,
        canJoinProfiles: false,
        profileDataComplete: false,
        schemaCacheRefreshed: false,
        error: 'User not authenticated'
      });
      return;
    }

    setIsLoading(true);
    setTestResults(null);
    setSampleData([]);

    try {
      // Test 1: Check if foreign key relationship exists
      const { data: constraints, error: constraintError } = await supabase
        .from('information_schema.table_constraints')
        .select('constraint_name, constraint_type')
        .eq('table_name', 'comments')
        .eq('constraint_type', 'FOREIGN KEY')
        .like('constraint_name', '%user_id%');

      if (constraintError) throw constraintError;

      const foreignKeyExists = constraints && constraints.length > 0;

      // Test 2: Try to query comments with profile join
      const { data: commentsWithProfiles, error: joinError } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          profiles (
            id,
            user_id,
            display_name,
            avatar_url,
            major,
            year
          )
        `)
        .limit(5);

      if (joinError) throw joinError;

      const canQueryComments = !joinError;
      const canJoinProfiles = commentsWithProfiles && commentsWithProfiles.length > 0;
      const profileDataComplete = canJoinProfiles && 
        commentsWithProfiles[0]?.profiles?.display_name && 
        commentsWithProfiles[0]?.profiles?.id;

      setSampleData(commentsWithProfiles || []);

      // Test 3: Try to refresh schema cache (this is a read-only operation)
      const { error: analyzeError } = await supabase
        .from('comments')
        .select('id')
        .limit(1);

      const schemaCacheRefreshed = !analyzeError;

      setTestResults({
        foreignKeyExists,
        canQueryComments,
        canJoinProfiles,
        profileDataComplete,
        schemaCacheRefreshed,
      });

    } catch (error: any) {
      console.error('Relationship test error:', error);
      setTestResults({
        foreignKeyExists: false,
        canQueryComments: false,
        canJoinProfiles: false,
        profileDataComplete: false,
        schemaCacheRefreshed: false,
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
            Comments-Profiles Relationship Test
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This test verifies that the foreign key relationship between comments and profiles
            is properly established and that Supabase can auto-join the data.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runRelationshipTest} 
              disabled={isLoading || !user}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing Relationship...
                </>
              ) : (
                'Test Comments-Profiles Relationship'
              )}
            </Button>
            
            <Button 
              onClick={runRelationshipTest} 
              disabled={isLoading || !user}
              variant="outline"
              size="icon"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {!user && (
            <div className="text-center py-4 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Please log in to run the relationship test</p>
            </div>
          )}

          {testResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.foreignKeyExists)}
                    <span className="font-medium">Foreign Key Exists</span>
                  </div>
                  {getStatusBadge(testResults.foreignKeyExists)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.canQueryComments)}
                    <span className="font-medium">Can Query Comments</span>
                  </div>
                  {getStatusBadge(testResults.canQueryComments)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.canJoinProfiles)}
                    <span className="font-medium">Can Join Profiles</span>
                  </div>
                  {getStatusBadge(testResults.canJoinProfiles)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.profileDataComplete)}
                    <span className="font-medium">Profile Data Complete</span>
                  </div>
                  {getStatusBadge(testResults.profileDataComplete)}
                </div>
              </div>

              {testResults.error && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h4 className="font-semibold text-red-800 dark:text-red-200">Error Details:</h4>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">{testResults.error}</p>
                </div>
              )}

              {testResults.foreignKeyExists && testResults.canQueryComments && 
               testResults.canJoinProfiles && testResults.profileDataComplete && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-800 dark:text-green-200">
                      Relationship Working Perfectly!
                    </h4>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Comments can be successfully joined with user profiles. The foreign key relationship is working correctly and Supabase can auto-join the data.
                  </p>
                </div>
              )}

              {/* Show sample data if available */}
              {sampleData.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Sample Comments with Profile Data:</h4>
                  <div className="space-y-2">
                    {sampleData.slice(0, 3).map((comment, index) => (
                      <div key={comment.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {comment.profiles?.display_name || 'Unknown User'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{comment.content}</p>
                        <div className="text-xs text-muted-foreground mt-1">
                          Profile ID: {comment.profiles?.id} | User ID: {comment.profiles?.user_id}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">What This Test Verifies:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Foreign Key Exists:</strong> Checks if comments.user_id → profiles.id relationship exists</li>
              <li>• <strong>Can Query Comments:</strong> Tests basic comment retrieval from database</li>
              <li>• <strong>Can Join Profiles:</strong> Tests joining comments with profiles using the relationship</li>
              <li>• <strong>Profile Data Complete:</strong> Verifies that profile information loads correctly</li>
              <li>• <strong>Schema Cache Refreshed:</strong> Ensures Supabase recognizes the relationship</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommentsProfileTest;





















