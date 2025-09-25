import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PostActions } from '@/services/posts/postActions';
import { fileUploadService } from '@/services/fileUploadService';
import { CheckCircle, XCircle, Clock, AlertTriangle, Upload, FileText, Image } from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  details?: string;
}

export const PostTestRunner = () => {
  const [testText, setTestText] = useState('This is a test post with simple text content.');
  const [longText, setLongText] = useState('This is a very long test post that exceeds 500 characters. '.repeat(10));
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedUnsupportedFile, setSelectedUnsupportedFile] = useState<File | null>(null);
  
  const [testResults, setTestResults] = useState<TestResult[]>([
    { id: 'TC-Post-01', name: 'Post with text only', status: 'pending' },
    { id: 'TC-Post-02', name: 'Post with image upload', status: 'pending' },
    { id: 'TC-Post-03', name: 'Post with long text (>500 chars)', status: 'pending' },
    { id: 'TC-Post-04', name: 'Failure on unsupported file format', status: 'pending' }
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

  const testTextOnlyPost = async () => {
    if (!user) {
      throw new Error('User must be authenticated to create posts');
    }

    const postData = {
      content: testText,
      title: 'Test Text Post',
      post_type: 'text' as const,
      user_id: user.id,
      visibility: 'public' as const,
      tags: ['test', 'automation']
    };

    const result = await PostActions.createPost(postData);
    
    if (!result || !result.id) {
      throw new Error('Post creation failed - no post data returned');
    }

    if (result.content !== testText) {
      throw new Error('Post content does not match expected text');
    }

    toast({
      title: "TC-Post-01 Passed",
      description: "Text-only post created successfully"
    });
  };

  const testImageUploadPost = async () => {
    if (!user) {
      throw new Error('User must be authenticated to create posts');
    }

    if (!selectedImageFile) {
      throw new Error('No image file selected for testing');
    }

    // Validate file type
    const validation = fileUploadService.validateFile(selectedImageFile, 'post');
    if (!validation.valid) {
      throw new Error(`File validation failed: ${validation.error}`);
    }

    // Upload the image first
    const uploadResult = await fileUploadService.uploadFile(
      selectedImageFile,
      'post',
      user.id
    );

    if (!uploadResult.url) {
      throw new Error('Image upload failed - no URL returned');
    }

    // Create post with image
    const postData = {
      content: 'Test post with image upload',
      title: 'Test Image Post',
      post_type: 'image' as const,
      user_id: user.id,
      visibility: 'public' as const,
      image_url: uploadResult.url,
      tags: ['test', 'image']
    };

    const result = await PostActions.createPost(postData);
    
    if (!result || !result.id) {
      throw new Error('Post creation with image failed');
    }

    if (result.image_url !== uploadResult.url) {
      throw new Error('Post image URL does not match uploaded image');
    }

    toast({
      title: "TC-Post-02 Passed",
      description: "Post with image upload created successfully"
    });
  };

  const testLongTextPost = async () => {
    if (!user) {
      throw new Error('User must be authenticated to create posts');
    }

    if (longText.length <= 500) {
      throw new Error(`Text is not long enough for test (${longText.length} chars, need >500)`);
    }

    const postData = {
      content: longText,
      title: 'Test Long Text Post',
      post_type: 'text' as const,
      user_id: user.id,
      visibility: 'public' as const,
      tags: ['test', 'longtext']
    };

    const result = await PostActions.createPost(postData);
    
    if (!result || !result.id) {
      throw new Error('Long text post creation failed');
    }

    if (result.content !== longText) {
      throw new Error('Long text content was truncated or modified');
    }

    toast({
      title: "TC-Post-03 Passed",
      description: `Long text post created successfully (${longText.length} chars)`
    });
  };

  const testUnsupportedFileFormat = async () => {
    if (!user) {
      throw new Error('User must be authenticated to test file upload');
    }

    if (!selectedUnsupportedFile) {
      throw new Error('No unsupported file selected for testing');
    }

    try {
      // This should fail validation
      const validation = fileUploadService.validateFile(selectedUnsupportedFile, 'post');
      
      if (validation.valid) {
        // If validation passes, try the upload and it should fail
        await fileUploadService.uploadFile(
          selectedUnsupportedFile,
          'post',
          user.id
        );
        
        // If we get here, the test failed because the upload succeeded
        throw new Error('Upload should have failed with unsupported file format');
      } else {
        // Validation correctly failed - this is expected behavior
        if (!validation.error || !validation.error.includes('not allowed')) {
          throw new Error('File validation failed but not for the expected reason');
        }
        
        // Test passed - the system correctly rejected the unsupported file
        return;
      }
    } catch (error: any) {
      // Check if this is the expected validation error
      if (error.message.includes('File type not allowed') || 
          error.message.includes('not supported') ||
          error.message.includes('Upload should have failed')) {
        // Re-throw the test failure message
        if (error.message.includes('Upload should have failed')) {
          throw error;
        }
        // Otherwise, this is expected behavior
        return;
      }
      // Re-throw unexpected errors
      throw error;
    }
  };

  const runAllTests = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to run post creation tests",
        variant: "destructive"
      });
      return;
    }

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
      // Run tests sequentially to avoid conflicts
      await runTest('TC-Post-01', testTextOnlyPost);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Post-02', testImageUploadPost);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Post-03', testLongTextPost);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Post-04', testUnsupportedFileFormat);
      
    } catch (error) {
      console.error('Test runner error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      passed: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
    }
  };

  const handleUnsupportedFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedUnsupportedFile(file);
    }
  };

  const passedTests = testResults.filter(t => t.status === 'passed').length;
  const failedTests = testResults.filter(t => t.status === 'failed').length;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Post Creation Testing Suite
          </span>
          <div className="flex gap-2 text-sm">
            <span className="text-green-600">Passed: {passedTests}</span>
            <span className="text-red-600">Failed: {failedTests}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test Configuration</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testText">Test Text Content</Label>
              <Textarea
                id="testText"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter test post content..."
                rows={3}
              />
              <div className="text-sm text-muted-foreground">
                Current length: {testText.length} characters
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="longText">Long Text Content (&gt;500 chars)</Label>
              <Textarea
                id="longText"
                value={longText}
                onChange={(e) => setLongText(e.target.value)}
                placeholder="Enter long test content..."
                rows={4}
              />
              <div className="text-sm text-muted-foreground">
                Current length: {longText.length} characters 
                {longText.length > 500 ? '✅' : '❌ (needs >500)'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imageFile">Image File (supported format)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="imageFile"
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileSelect}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  <Image className="h-4 w-4 text-muted-foreground" />
                </div>
                {selectedImageFile && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {selectedImageFile.name} ({selectedImageFile.type})
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unsupportedFile">Unsupported File Format</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="unsupportedFile"
                    type="file"
                    accept=".exe,.bat,.sh,.script"
                    onChange={handleUnsupportedFileSelect}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-destructive file:text-destructive-foreground hover:file:bg-destructive/90"
                  />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                {selectedUnsupportedFile && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {selectedUnsupportedFile.name} ({selectedUnsupportedFile.type})
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Authentication Status */}
        {!user && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to run post creation tests. Please authenticate first.
            </AlertDescription>
          </Alert>
        )}

        {/* Run Tests Button */}
        <div className="flex justify-center">
          <Button 
            onClick={runAllTests} 
            disabled={isRunning || !user}
            size="lg"
            className="w-full md:w-auto"
          >
            {isRunning ? 'Running Post Tests...' : 'Run All Post Creation Tests'}
          </Button>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {testResults.map((test) => (
            <Card key={test.id} className="border-l-4 border-l-gray-200 data-[status=passed]:border-l-green-500 data-[status=failed]:border-l-red-500 data-[status=running]:border-l-blue-500" data-status={test.status}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <div className="font-medium">{test.id}: {test.name}</div>
                      {test.details && (
                        <div className="text-sm text-muted-foreground">{test.details}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {test.duration && (
                      <span className="text-sm text-muted-foreground">{test.duration}ms</span>
                    )}
                    {getStatusBadge(test.status)}
                  </div>
                </div>
                {test.error && (
                  <Alert className="mt-3" variant="destructive">
                    <AlertDescription>{test.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Test Summary */}
        {(passedTests > 0 || failedTests > 0) && (
          <Alert className={failedTests > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            <AlertDescription>
              Post Creation Tests {failedTests > 0 ? 'Completed with Failures' : 'Passed'}: {passedTests} passed, {failedTests} failed out of {testResults.length} total tests.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
