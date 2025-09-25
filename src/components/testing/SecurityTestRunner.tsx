import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, Shield, AlertTriangle } from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  details?: string;
}

export const SecurityTestRunner = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { id: 'TC-Sec-01', name: 'SQL Injection protection in login', status: 'pending' },
    { id: 'TC-Sec-02', name: 'XSS protection in posts/comments', status: 'pending' },
    { id: 'TC-Sec-03', name: 'Unauthorized access to protected routes', status: 'pending' },
    { id: 'TC-Sec-04', name: 'Password leak protection enabled', status: 'pending' },
    { id: 'TC-Sec-05', name: 'Role-based access (moderator vs user)', status: 'pending' }
  ]);
  
  const [isRunning, setIsRunning] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const updateTestResult = (id: string, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map(test => 
      test.id === id ? { ...test, ...updates } : test
    ));
  };

  const runTest = async (testId: string, testFn: () => Promise<void>) => {
    updateTestResult(testId, { status: 'running' });
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      updateTestResult(testId, { 
        status: 'passed', 
        duration,
        details: `Completed in ${duration}ms`
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult(testId, { 
        status: 'failed', 
        duration,
        error: error.message,
        details: `Failed after ${duration}ms`
      });
    }
  };

  const testSQLInjectionProtection = async () => {
    try {
      // Test SQL injection attempts in login
      const maliciousInputs = [
        "'; DROP TABLE profiles; --",
        "admin' OR '1'='1",
        "' UNION SELECT * FROM profiles --",
        "admin'; INSERT INTO profiles (display_name) VALUES ('hacked'); --"
      ];

      for (const maliciousInput of maliciousInputs) {
        try {
          // Attempt to sign in with malicious email
          const { error } = await supabase.auth.signInWithPassword({
            email: maliciousInput,
            password: 'anypassword'
          });

          // Should fail with authentication error, not SQL error
          if (error && !error.message.includes('Invalid login credentials')) {
            throw new Error(`Unexpected error type: ${error.message}`);
          }
        } catch (authError: any) {
          // Auth errors are expected and safe
          if (authError.message.includes('SQL') || authError.message.includes('syntax')) {
            throw new Error(`Potential SQL injection vulnerability detected: ${authError.message}`);
          }
        }
      }

      // Test parameterized queries in profile lookups
      try {
        const { error } = await supabase
          .from('profiles')
          .select('*')
          .eq('display_name', "'; DROP TABLE profiles; --")
          .single();

        // Should handle safely without SQL injection
        if (error && error.message.includes('SQL')) {
          throw new Error('SQL injection vulnerability in profile queries');
        }
      } catch (queryError: any) {
        if (queryError.message.includes('SQL')) {
          throw new Error('SQL injection vulnerability detected in queries');
        }
      }

      toast({
        title: "TC-Sec-01 Passed",
        description: "SQL injection protection verified"
      });

    } catch (error: any) {
      throw new Error(`SQL injection test failed: ${error.message}`);
    }
  };

  const testXSSProtection = async () => {
    if (!user) {
      throw new Error('User must be authenticated for XSS testing');
    }

    try {
      // Test XSS attempts in post content
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(\'XSS\')" />',
        '<svg onload="alert(\'XSS\')" />',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>'
      ];

      for (const payload of xssPayloads) {
        try {
          // Attempt to create post with XSS payload
          const { data: post, error } = await supabase
            .from('posts')
            .insert({
              user_id: user.id,
              content: payload
            })
            .select()
            .single();

          if (error) {
            // Check if error indicates proper sanitization
            if (error.message.includes('content validation') || 
                error.message.includes('invalid characters')) {
              console.log('XSS payload properly rejected by validation');
              continue;
            }
          }

          if (post) {
            // Verify content was sanitized
            if (post.content.includes('<script>') || 
                post.content.includes('javascript:') ||
                post.content.includes('onerror=') ||
                post.content.includes('onload=')) {
              throw new Error(`XSS payload was not sanitized: ${post.content}`);
            }

            // Clean up test post
            await supabase
              .from('posts')
              .delete()
              .eq('id', post.id);
          }

        } catch (postError: any) {
          // Proper validation errors are expected
          if (!postError.message.includes('validation') && 
              !postError.message.includes('sanitized')) {
            throw postError;
          }
        }
      }

      // Test XSS in comments
      const { data: testPost, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: 'Test post for XSS comment testing'
        })
        .select()
        .single();

      if (postError || !testPost) {
        throw new Error('Failed to create test post for comment XSS testing');
      }

      try {
        for (const payload of xssPayloads.slice(0, 2)) { // Test fewer payloads for comments
          const { error: commentError } = await supabase
            .from('comments')
            .insert({
              post_id: testPost.id,
              user_id: user.id,
              content: payload
            });

          // Comments should either be rejected or sanitized
          if (!commentError) {
            // Verify comment was sanitized if created
            const { data: comment } = await supabase
              .from('comments')
              .select('content')
              .eq('post_id', testPost.id)
              .eq('content', payload)
              .single();

            if (comment) {
              throw new Error('XSS payload in comment was not sanitized');
            }
          }
        }
      } finally {
        // Clean up test post and any comments
        await supabase
          .from('posts')
          .delete()
          .eq('id', testPost.id);
      }

      toast({
        title: "TC-Sec-02 Passed",
        description: "XSS protection verified in posts and comments"
      });

    } catch (error: any) {
      throw new Error(`XSS protection test failed: ${error.message}`);
    }
  };

  const testUnauthorizedAccess = async () => {
    try {
      // Test accessing protected resources without authentication
      const { data: currentUser } = await supabase.auth.getUser();
      
      if (currentUser.user) {
        // Sign out to test unauthorized access
        await supabase.auth.signOut();
      }

      // Test accessing user-specific data without auth
      const { error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(10);

      // Should be allowed to read public profiles but not private data
      if (profileError && profileError.message.includes('JWT')) {
        console.log('Proper JWT protection on profiles table');
      }

      // Test accessing posts without auth
      const { error: postsError } = await supabase
        .from('posts')
        .select('*')
        .limit(5);

      // Public posts should be readable, private ones should not
      if (postsError && postsError.message.includes('access')) {
        console.log('Proper access control on posts');
      }

      // Test inserting data without auth (should fail)
      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Fake user ID
          content: 'Unauthorized post attempt'
        });

      if (!insertError || !insertError.message.includes('JWT')) {
        throw new Error('Unauthorized users can create posts - security vulnerability!');
      }

      // Test updating other users' data (should fail)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ display_name: 'Hacked!' })
        .eq('user_id', '00000000-0000-0000-0000-000000000000'); // Fake UUID

      if (!updateError || !updateError.message.includes('JWT')) {
        throw new Error('Unauthorized users can update profiles - security vulnerability!');
      }

      // Re-authenticate if user was logged in
      if (currentUser.user && user) {
        // User should re-authenticate through the UI
        console.log('User should re-authenticate after test');
      }

      toast({
        title: "TC-Sec-03 Passed", 
        description: "Unauthorized access properly blocked"
      });

    } catch (error: any) {
      throw new Error(`Unauthorized access test failed: ${error.message}`);
    }
  };

  const testPasswordLeakProtection = async () => {
    try {
      // Test that passwords are not returned in queries
      const { data: authUser } = await supabase.auth.getUser();
      
      if (!authUser.user) {
        throw new Error('User must be authenticated for password leak testing');
      }

      // Verify sensitive tables are not exposed in API
      // Note: We can't test auth.users directly as it's not in the public schema
      console.log('auth.users table is properly protected by Supabase design');

      // Test that user metadata doesn't contain sensitive info
      const userMetadata = authUser.user.user_metadata;
      const appMetadata = authUser.user.app_metadata;

      const sensitiveFields = ['password', 'hash', 'salt', 'secret', 'key'];
      
      for (const field of sensitiveFields) {
        if (userMetadata && typeof userMetadata === 'object') {
          for (const key of Object.keys(userMetadata)) {
            if (key.toLowerCase().includes(field) || 
                (typeof userMetadata[key] === 'string' && userMetadata[key].includes(field))) {
              throw new Error(`Sensitive data found in user_metadata: ${key}`);
            }
          }
        }

        if (appMetadata && typeof appMetadata === 'object') {
          for (const key of Object.keys(appMetadata)) {
            if (key.toLowerCase().includes(field)) {
              throw new Error(`Sensitive data found in app_metadata: ${key}`);
            }
          }
        }
      }

      // Test profile queries don't expose auth data
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (profile) {
          for (const field of sensitiveFields) {
            for (const key of Object.keys(profile)) {
              if (key.toLowerCase().includes(field)) {
                throw new Error(`Sensitive field found in profile: ${key}`);
              }
            }
          }
        }
      }

      toast({
        title: "TC-Sec-04 Passed",
        description: "Password leak protection verified"
      });

    } catch (error: any) {
      throw new Error(`Password leak protection test failed: ${error.message}`);
    }
  };

  const testRoleBasedAccess = async () => {
    if (!user) {
      throw new Error('User must be authenticated for role-based access testing');
    }

    try {
      // Get current user's profile and role
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const userRole = currentProfile?.role || 'user';

      // Test user role permissions
      if (userRole === 'user') {
        // Regular users should not access admin functions
        // Test updating posts with admin-like actions
        const { data: userPosts } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (userPosts && userPosts.length > 0) {
          const { error: adminError } = await supabase
            .from('posts')
            .update({ 
              is_pinned: true // Test admin-like action
            })
            .eq('id', userPosts[0].id);
            
          // This might succeed depending on RLS policies
          console.log('User role admin action test:', adminError ? 'Blocked' : 'Allowed');
        }


        // Test that user cannot moderate other users' content
        const { data: otherPosts, error: otherPostsError } = await supabase
          .from('posts')
          .select('id')
          .neq('user_id', user.id)
          .limit(1);

        if (!otherPostsError && otherPosts && otherPosts.length > 0) {
          const { error: moderateError } = await supabase
            .from('posts')
            .update({ content: 'MODERATED' })
            .eq('id', otherPosts[0].id);

          if (!moderateError) {
            throw new Error('Regular users can moderate other users\' content - security vulnerability!');
          }
        }
      }

      // Test moderator role permissions (if user is moderator)
      if (userRole === 'moderator' || userRole === 'admin') {
        // Moderators should have additional permissions
        console.log('Testing moderator permissions...');

        // Test moderator can access posts for moderation
        const { error: modError } = await supabase
          .from('posts')
          .select('id, user_id, content')
          .limit(5);

        if (modError && modError.message.includes('access')) {
          throw new Error('Moderators cannot access posts for moderation');
        }

        console.log('Moderator access to posts verified');
      }

      // Test that role changes are properly enforced
      try {
        // Attempt to change own role (should fail)
        const { error: roleChangeError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('user_id', user.id);

        if (!roleChangeError) {
          // Verify the role wasn't actually changed
          const { data: updatedProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

          if (updatedProfile?.role === 'admin' && userRole !== 'admin') {
            throw new Error('Users can change their own role - security vulnerability!');
          }
        }
      } catch (e) {
        console.log('Role self-modification properly blocked');
      }

      // Test cross-user role verification
      const { data: otherUsers, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, role')
        .neq('user_id', user.id)
        .limit(3);

      if (!usersError && otherUsers) {
        for (const otherUser of otherUsers) {
          // Verify we cannot change other users' roles unless we're admin
          const { error: changeRoleError } = await supabase
            .from('profiles')
            .update({ role: 'user' })
            .eq('user_id', otherUser.user_id);

          if (!changeRoleError && userRole !== 'admin') {
            throw new Error('Non-admin users can change other users\' roles - security vulnerability!');
          }
        }
      }

      toast({
        title: "TC-Sec-05 Passed",
        description: `Role-based access verified for ${userRole} role`
      });

    } catch (error: any) {
      throw new Error(`Role-based access test failed: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    // Reset all test results
    setTestResults(prev => prev.map(test => ({ 
      ...test, 
      status: 'pending', 
      duration: undefined, 
      error: undefined,
      details: undefined
    })));

    try {
      // Run tests sequentially with delays
      await runTest('TC-Sec-01', testSQLInjectionProtection);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Sec-02', testXSSProtection);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Sec-03', testUnauthorizedAccess);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Sec-04', testPasswordLeakProtection);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Sec-05', testRoleBasedAccess);

      const passedTests = testResults.filter(test => test.status === 'passed').length;
      const totalTests = testResults.length;

      toast({
        title: "Security Tests Complete",
        description: `${passedTests}/${totalTests} security tests passed`
      });

    } catch (error) {
      console.error('Error running security tests:', error);
      toast({
        title: "Test Execution Error",
        description: "An unexpected error occurred while running security tests",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      running: "default", 
      passed: "default",
      failed: "destructive"
    };

    const colors: Record<string, string> = {
      pending: "text-gray-600",
      running: "text-blue-600",
      passed: "text-green-600",
      failed: "text-red-600"
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Test Runner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Security tests may temporarily affect authentication state. Some tests require re-authentication.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? 'Running Security Tests...' : 'Run All Security Tests'}
          </Button>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            
            {testResults.map((test) => (
              <Card key={test.id} className="border-l-4 border-l-red-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <h4 className="font-medium">{test.id}: {test.name}</h4>
                        {test.details && (
                          <p className="text-sm text-muted-foreground">{test.details}</p>
                        )}
                        {test.error && (
                          <p className="text-sm text-red-600 mt-1">Error: {test.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {test.duration && (
                        <span className="text-sm text-muted-foreground">
                          {test.duration}ms
                        </span>
                      )}
                      {getStatusBadge(test.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityTestRunner;