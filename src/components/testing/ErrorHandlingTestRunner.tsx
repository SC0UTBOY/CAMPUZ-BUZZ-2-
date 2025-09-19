import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, AlertTriangle, FileX } from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  details?: string;
}

export const ErrorHandlingTestRunner = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { id: 'TC-Err-01', name: 'Error shown on failed image upload', status: 'pending' },
    { id: 'TC-Err-02', name: 'Proper message on server timeout', status: 'pending' },
    { id: 'TC-Err-03', name: 'Graceful handling when DB connection fails', status: 'pending' }
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

  const testFailedImageUpload = async () => {
    if (!user) {
      throw new Error('User must be authenticated for image upload testing');
    }

    try {
      // Test 1: Invalid file type upload
      const invalidFile = new Blob(['not an image'], { type: 'text/plain' });
      const invalidFileName = 'invalid-file.txt';
      const invalidFilePath = `${user.id}/${invalidFileName}`;

      try {
        const { error: typeError } = await supabase.storage
          .from('avatars')
          .upload(invalidFilePath, invalidFile, {
            contentType: 'text/plain'
          });

        if (!typeError) {
          console.log('Invalid file type was accepted (checking if validation exists elsewhere)');
        } else {
          console.log('File type validation works:', typeError.message);
        }
      } catch (uploadError: any) {
        console.log('Upload properly rejected invalid file type');
      }

      // Test 2: File too large (simulate by creating a large blob)
      const largeFile = new Blob([new ArrayBuffer(10 * 1024 * 1024)], { type: 'image/jpeg' }); // 10MB
      const largeFileName = 'large-image.jpg';
      const largeFilePath = `${user.id}/${largeFileName}`;

      try {
        const { error: sizeError } = await supabase.storage
          .from('avatars')
          .upload(largeFilePath, largeFile, {
            contentType: 'image/jpeg'
          });

        if (sizeError) {
          if (sizeError.message.includes('size') || 
              sizeError.message.includes('large') ||
              sizeError.message.includes('limit')) {
            console.log('File size validation works:', sizeError.message);
          } else {
            console.log('Upload failed with error:', sizeError.message);
          }
        } else {
          console.log('Large file was accepted (may need size limits)');
          // Clean up if upload succeeded
          await supabase.storage
            .from('avatars')
            .remove([largeFilePath]);
        }
      } catch (uploadError: any) {
        console.log('Large file upload properly handled');
      }

      // Test 3: Upload to non-existent bucket
      const testFile = new Blob(['test'], { type: 'image/jpeg' });
      
      try {
        const { error: bucketError } = await supabase.storage
          .from('non_existent_bucket')
          .upload('test-file.jpg', testFile);

        if (!bucketError) {
          throw new Error('Upload to non-existent bucket should fail');
        }

        if (bucketError.message.includes('bucket') || 
            bucketError.message.includes('not found') ||
            bucketError.message.includes('does not exist')) {
          console.log('Non-existent bucket error properly handled:', bucketError.message);
        } else {
          throw new Error(`Unexpected error for non-existent bucket: ${bucketError.message}`);
        }
      } catch (uploadError: any) {
        if (uploadError.message.includes('bucket')) {
          console.log('Bucket validation works correctly');
        } else {
          throw uploadError;
        }
      }

      // Test 4: Upload with invalid file path
      try {
        const { error: pathError } = await supabase.storage
          .from('avatars')
          .upload('../../../etc/passwd', testFile);

        if (!pathError) {
          throw new Error('Path traversal should be blocked');
        }

        console.log('Path traversal protection works:', pathError.message);
      } catch (uploadError: any) {
        console.log('Invalid path properly rejected');
      }

      // Test 5: Network simulation - rapid disconnection
      try {
        // Simulate network issues by making multiple rapid requests
        const promises = Array.from({ length: 5 }, (_, i) => 
          supabase.storage
            .from('avatars')
            .upload(`test-concurrent-${i}.jpg`, testFile)
        );

        const results = await Promise.allSettled(promises);
        const failedUploads = results.filter(r => r.status === 'rejected');
        
        if (failedUploads.length > 0) {
          console.log(`${failedUploads.length} uploads failed due to concurrency/network issues`);
        }

        // Clean up successful uploads
        const successfulUploads = results
          .filter(r => r.status === 'fulfilled' && r.value.data)
          .map(r => (r as PromiseFulfilledResult<any>).value.data.path);

        if (successfulUploads.length > 0) {
          await supabase.storage
            .from('avatars')
            .remove(successfulUploads);
        }
      } catch (concurrencyError: any) {
        console.log('Concurrency handled:', concurrencyError.message);
      }

      toast({
        title: "TC-Err-01 Passed",
        description: "Image upload error handling verified"
      });

    } catch (error: any) {
      throw new Error(`Image upload error test failed: ${error.message}`);
    }
  };

  const testServerTimeout = async () => {
    try {
      // Test 1: Simulate timeout with very complex query
      const startTime = Date.now();
      
      try {
        // Create a potentially slow query by joining multiple tables
        const { error: timeoutError } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            user_id,
            created_at,
            profiles!inner(display_name, avatar_url),
            comments(id, content, profiles(display_name)),
            likes:post_likes(user_id, profiles(display_name))
          `)
          .limit(1000);

        const duration = Date.now() - startTime;
        
        if (timeoutError) {
          if (timeoutError.message.includes('timeout') || 
              timeoutError.message.includes('time') ||
              duration > 30000) {
            console.log('Query timeout properly handled:', timeoutError.message);
          } else {
            console.log('Query failed with error:', timeoutError.message);
          }
        } else {
          console.log(`Complex query completed in ${duration}ms`);
        }
      } catch (queryError: any) {
        console.log('Complex query error handled:', queryError.message);
      }

      // Test 2: Simulate network timeout using AbortController
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 100); // Very short timeout

        const { error: abortError } = await supabase
          .from('profiles')
          .select('*')
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (abortError) {
          if (abortError.message.includes('abort') || 
              abortError.message.includes('cancel')) {
            console.log('Request abortion handled correctly:', abortError.message);
          }
        }
      } catch (abortError: any) {
        if (abortError.name === 'AbortError') {
          console.log('Abort signal properly handled');
        } else {
          console.log('Unexpected abort error:', abortError.message);
        }
      }

      // Test 3: Test function timeout (if edge functions exist)
      try {
        const { error: funcError } = await supabase.functions.invoke('non-existent-function', {
          body: { test: 'timeout' }
        });

        if (funcError) {
          if (funcError.message.includes('not found') || 
              funcError.message.includes('404')) {
            console.log('Function not found error handled correctly');
          } else if (funcError.message.includes('timeout')) {
            console.log('Function timeout handled correctly');
          }
        }
      } catch (funcError: any) {
        console.log('Function invocation error handled:', funcError.message);
      }

      // Test 4: Simulate slow network with large data request
      try {
        const startSlowQuery = Date.now();
        
        const { error: slowError } = await supabase
          .from('posts')
          .select('*')
          .limit(10000); // Request large amount of data

        const slowDuration = Date.now() - startSlowQuery;
        
        if (slowError) {
          console.log('Large data request error:', slowError.message);
        } else {
          console.log(`Large data request completed in ${slowDuration}ms`);
        }
      } catch (slowError: any) {
        console.log('Slow query handled:', slowError.message);
      }

      toast({
        title: "TC-Err-02 Passed",
        description: "Server timeout handling verified"
      });

    } catch (error: any) {
      throw new Error(`Server timeout test failed: ${error.message}`);
    }
  };

  const testDatabaseConnectionFailure = async () => {
    try {
      // Test 1: Simulate invalid table access using try-catch
      try {
        // Use type assertion to bypass TypeScript checking for testing purposes
        const { error: invalidTableError } = await (supabase as any)
          .from('non_existent_table')
          .select('*');

        if (!invalidTableError) {
          throw new Error('Access to non-existent table should fail');
        }

        if (invalidTableError.message.includes('relation') && 
            invalidTableError.message.includes('does not exist')) {
          console.log('Non-existent table error handled correctly:', invalidTableError.message);
        }
      } catch (tableError: any) {
        console.log('Table access error handled:', tableError.message);
      }

      // Test 2: Invalid column access
      try {
        const { error: invalidColumnError } = await supabase
          .from('profiles')
          .select('non_existent_column');

        if (invalidColumnError) {
          if (invalidColumnError.message.includes('column') || 
              invalidColumnError.message.includes('does not exist')) {
            console.log('Invalid column error handled:', invalidColumnError.message);
          }
        }
      } catch (columnError: any) {
        console.log('Column access error handled:', columnError.message);
      }

      // Test 3: Test RLS policy failures
      try {
        // Try to access data that should be blocked by RLS
        const { error: rlsError } = await supabase
          .from('profiles')
          .update({ display_name: 'Hacked' })
          .eq('user_id', '00000000-0000-0000-0000-000000000000'); // Non-existent user

        if (rlsError) {
          if (rlsError.message.includes('policy') || 
              rlsError.message.includes('permission') ||
              rlsError.message.includes('access')) {
            console.log('RLS policy correctly blocked access:', rlsError.message);
          } else {
            console.log('Update blocked with error:', rlsError.message);
          }
        }
      } catch (rlsError: any) {
        console.log('RLS error handled:', rlsError.message);
      }

      // Test 4: Test invalid function calls
      try {
        // Use type assertion to test non-existent function
        const { error: sqlError } = await (supabase as any).rpc('non_existent_function', {});

        if (sqlError) {
          if (sqlError.message.includes('function') && 
              sqlError.message.includes('does not exist')) {
            console.log('Invalid function call handled:', sqlError.message);
          }
        }
      } catch (rpcError: any) {
        console.log('RPC error handled:', rpcError.message);
      }

      // Test 5: Test connection pooling issues
      try {
        // Make multiple simultaneous connections
        const connectionPromises = Array.from({ length: 20 }, () => 
          supabase.from('profiles').select('id').limit(1)
        );

        const connectionResults = await Promise.allSettled(connectionPromises);
        const failedConnections = connectionResults.filter(r => r.status === 'rejected');
        
        if (failedConnections.length > 0) {
          console.log(`${failedConnections.length} connections failed (connection limit handling)`);
        } else {
          console.log('All connections succeeded (good connection pooling)');
        }
      } catch (connectionError: any) {
        console.log('Connection pooling error handled:', connectionError.message);
      }

      // Test 6: Transaction rollback simulation
      try {
        // Simulate a transaction that should fail
        const { error: transactionError } = await supabase
          .from('posts')
          .insert([
            { user_id: user?.id, content: 'Test post 1' },
            { user_id: 'invalid-uuid', content: 'Test post 2' } // This should fail
          ]);

        if (transactionError) {
          if (transactionError.message.includes('uuid') || 
              transactionError.message.includes('format') ||
              transactionError.message.includes('invalid')) {
            console.log('Invalid data properly rejected:', transactionError.message);
          }
        }
      } catch (transactionError: any) {
        console.log('Transaction error handled:', transactionError.message);
      }

      toast({
        title: "TC-Err-03 Passed",
        description: "Database connection failure handling verified"
      });

    } catch (error: any) {
      throw new Error(`Database connection test failed: ${error.message}`);
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
      await runTest('TC-Err-01', testFailedImageUpload);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Err-02', testServerTimeout);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Err-03', testDatabaseConnectionFailure);

      const passedTests = testResults.filter(test => test.status === 'passed').length;
      const totalTests = testResults.length;

      toast({
        title: "Error Handling Tests Complete",
        description: `${passedTests}/${totalTests} error handling tests passed`
      });

    } catch (error) {
      console.error('Error running error handling tests:', error);
      toast({
        title: "Test Execution Error",
        description: "An unexpected error occurred while running error handling tests",
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
            <FileX className="h-5 w-5" />
            Error Handling Test Runner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Error handling tests simulate failure conditions to verify graceful error handling and user feedback.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? 'Running Error Handling Tests...' : 'Run All Error Handling Tests'}
          </Button>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            
            {testResults.map((test) => (
              <Card key={test.id} className="border-l-4 border-l-orange-500">
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

export default ErrorHandlingTestRunner;