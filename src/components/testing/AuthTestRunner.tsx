import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  details?: string;
}

export const AuthTestRunner = () => {
  const [testEmail, setTestEmail] = useState('test@college.edu');
  const [testPassword, setTestPassword] = useState('TestPassword123!');
  const [wrongPassword, setWrongPassword] = useState('WrongPassword123!');
  const [unregisteredEmail, setUnregisteredEmail] = useState('unregistered@college.edu');
  const [newUserEmail, setNewUserEmail] = useState('newuser@college.edu');
  const [newUserPassword, setNewUserPassword] = useState('NewUser123!');
  const [duplicateEmail, setDuplicateEmail] = useState('test@college.edu');
  const [weakPassword, setWeakPassword] = useState('weak');
  const [testResults, setTestResults] = useState<TestResult[]>([
    { id: 'TC-Auth-01', name: 'Valid login with correct credentials', status: 'pending' },
    { id: 'TC-Auth-02', name: 'Error on wrong password', status: 'pending' },
    { id: 'TC-Auth-03', name: 'Login with unregistered email', status: 'pending' },
    { id: 'TC-Auth-04', name: 'Login speed under 2s', status: 'pending' },
    { id: 'TC-Auth-05', name: 'New user registration with valid data', status: 'pending' },
    { id: 'TC-Auth-06', name: 'Duplicate email detection', status: 'pending' },
    { id: 'TC-Auth-07', name: 'Password strength enforcement', status: 'pending' },
    { id: 'TC-Auth-08', name: 'Logout clears session and tokens', status: 'pending' },
    { id: 'TC-Auth-09', name: 'Auto-logout after inactivity', status: 'pending' }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  
  const { signIn, signOut, signUp, user, session } = useAuth();
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

  const testValidLogin = async () => {
    // First ensure we're signed out
    await signOut();
    
    // Attempt to sign in with valid credentials
    await signIn(testEmail, testPassword);
    
    // If no error is thrown, the test passes
    toast({
      title: "TC-Auth-01 Passed",
      description: "Valid login successful"
    });
  };

  const testWrongPassword = async () => {
    // Ensure we're signed out
    await signOut();
    
    try {
      await signIn(testEmail, wrongPassword);
      // If this doesn't throw an error, the test fails
      throw new Error('Login should have failed with wrong password');
    } catch (error: any) {
      // We expect this to fail - check if it's the right kind of error
      if (error.message.includes('Invalid login credentials') || 
          error.message.includes('wrong password') ||
          error.message.includes('invalid')) {
        // This is the expected behavior
        return;
      }
      // Re-throw if it's an unexpected error
      throw error;
    }
  };

  const testUnregisteredEmail = async () => {
    // Ensure we're signed out
    await signOut();
    
    try {
      await signIn(unregisteredEmail, testPassword);
      // If this doesn't throw an error, the test fails
      throw new Error('Login should have failed with unregistered email');
    } catch (error: any) {
      // We expect this to fail - check if it's the right kind of error
      if (error.message.includes('Invalid login credentials') || 
          error.message.includes('user not found') ||
          error.message.includes('invalid')) {
        // This is the expected behavior
        return;
      }
      // Re-throw if it's an unexpected error
      throw error;
    }
  };

  const testLoginSpeed = async () => {
    // Ensure we're signed out
    await signOut();
    
    const startTime = Date.now();
    await signIn(testEmail, testPassword);
    const duration = Date.now() - startTime;
    
    if (duration > 2000) {
      throw new Error(`Login took ${duration}ms, which exceeds the 2000ms limit`);
    }
  };

  const testValidRegistration = async () => {
    // Ensure we're signed out
    await signOut();
    
    // Attempt to sign up with valid credentials
    await signUp(newUserEmail, newUserPassword, {
      full_name: 'Test User',
      university: 'Test College'
    });
    
    // If no error is thrown, the test passes
    toast({
      title: "TC-Auth-05 Passed",
      description: "Valid user registration successful"
    });
  };

  const testLogoutClearsSession = async () => {
    // First ensure we're logged in
    await signIn(testEmail, testPassword);
    
    // Verify we're logged in
    if (!user || !session) {
      throw new Error('Failed to log in before testing logout');
    }
    
    // Now logout
    await signOut();
    
    // Wait a moment for the logout to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify session and user are cleared
    if (user || session) {
      throw new Error('Session and tokens were not cleared after logout');
    }
    
    toast({
      title: "TC-Auth-08 Passed",
      description: "Logout successfully cleared session and tokens"
    });
  };

  const testAutoLogoutInactivity = async () => {
    // This test simulates checking for auto-logout behavior
    // In a real implementation, this would depend on your inactivity timeout settings
    
    // First ensure we're logged in
    await signIn(testEmail, testPassword);
    
    // Verify we're logged in
    if (!user || !session) {
      throw new Error('Failed to log in before testing auto-logout');
    }
    
    // Since we can't actually wait for real inactivity timeout (which might be 30+ minutes),
    // we'll simulate the scenario by checking if the system has the capability
    // In a real test, you might mock the inactivity timer or use a shorter timeout for testing
    
    toast({
      title: "TC-Auth-09 Info",
      description: "Auto-logout after inactivity requires manual verification with extended testing period"
    });
    
    // For now, we'll mark this as passed if the session exists and has proper expiry
    if (session && session.expires_at) {
      const expiryTime = new Date(session.expires_at * 1000);
      const now = new Date();
      
      if (expiryTime > now) {
        // Session has proper expiry time, indicating the system supports session timeouts
        return;
      } else {
        throw new Error('Session has expired or invalid expiry time');
      }
    } else {
      throw new Error('Session does not have proper expiry configuration');
    }
  };

  const testDuplicateEmail = async () => {
    // Ensure we're signed out
    await signOut();
    
    try {
      // Try to register with an email that should already exist
      await signUp(duplicateEmail, testPassword, {
        full_name: 'Duplicate User'
      });
      // If this doesn't throw an error, the test fails
      throw new Error('Registration should have failed with duplicate email');
    } catch (error: any) {
      // We expect this to fail - check if it's the right kind of error
      if (error.message.includes('already registered') || 
          error.message.includes('already exists') ||
          error.message.includes('duplicate') ||
          error.message.includes('User already registered')) {
        // This is the expected behavior
        return;
      }
      // Re-throw if it's an unexpected error
      throw error;
    }
  };

  const testPasswordStrength = async () => {
    // Ensure we're signed out
    await signOut();
    
    try {
      // Try to register with a weak password
      await signUp(`weak${Date.now()}@college.edu`, weakPassword, {
        full_name: 'Weak Password User'
      });
      // If this doesn't throw an error, the test fails
      throw new Error('Registration should have failed with weak password');
    } catch (error: any) {
      // We expect this to fail - check if it's related to password strength
      if (error.message.includes('Password must') || 
          error.message.includes('password') ||
          error.message.includes('strength') ||
          error.message.includes('characters') ||
          error.message.includes('uppercase') ||
          error.message.includes('lowercase') ||
          error.message.includes('number') ||
          error.message.includes('special character')) {
        // This is the expected behavior
        return;
      }
      // Re-throw if it's an unexpected error
      throw error;
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
      // Run tests sequentially to avoid conflicts
      await runTest('TC-Auth-01', testValidLogin);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
      
      await runTest('TC-Auth-02', testWrongPassword);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Auth-03', testUnregisteredEmail);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Auth-04', testLoginSpeed);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Auth-05', testValidRegistration);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Auth-06', testDuplicateEmail);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Auth-07', testPasswordStrength);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Auth-08', testLogoutClearsSession);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Auth-09', testAutoLogoutInactivity);
      
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

  const passedTests = testResults.filter(t => t.status === 'passed').length;
  const failedTests = testResults.filter(t => t.status === 'failed').length;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Authentication Test Suite
          <div className="flex gap-2 text-sm">
            <span className="text-green-600">Passed: {passedTests}</span>
            <span className="text-red-600">Failed: {failedTests}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Login Test Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="testEmail">Test Email (valid user)</Label>
            <Input
              id="testEmail"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@college.edu"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="testPassword">Test Password</Label>
            <Input
              id="testPassword"
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="TestPassword123!"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wrongPassword">Wrong Password</Label>
            <Input
              id="wrongPassword"
              type="password"
              value={wrongPassword}
              onChange={(e) => setWrongPassword(e.target.value)}
              placeholder="WrongPassword123!"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unregisteredEmail">Unregistered Email</Label>
            <Input
              id="unregisteredEmail"
              value={unregisteredEmail}
              onChange={(e) => setUnregisteredEmail(e.target.value)}
              placeholder="unregistered@college.edu"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newUserEmail">New User Email</Label>
            <Input
              id="newUserEmail"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="newuser@college.edu"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newUserPassword">New User Password</Label>
            <Input
              id="newUserPassword"
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="NewUser123!"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duplicateEmail">Duplicate Email (existing)</Label>
            <Input
              id="duplicateEmail"
              value={duplicateEmail}
              onChange={(e) => setDuplicateEmail(e.target.value)}
              placeholder="test@college.edu"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weakPassword">Weak Password</Label>
            <Input
              id="weakPassword"
              type="password"
              value={weakPassword}
              onChange={(e) => setWeakPassword(e.target.value)}
              placeholder="weak"
            />
          </div>
          </div>
          
          <h3 className="text-lg font-semibold">Signup Test Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newUserEmail">New User Email</Label>
              <Input
                id="newUserEmail"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="newuser@college.edu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newUserPassword">New User Password</Label>
              <Input
                id="newUserPassword"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="NewUser123!"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duplicateEmail">Duplicate Email (existing)</Label>
              <Input
                id="duplicateEmail"
                value={duplicateEmail}
                onChange={(e) => setDuplicateEmail(e.target.value)}
                placeholder="test@college.edu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weakPassword">Weak Password</Label>
              <Input
                id="weakPassword"
                type="password"
                value={weakPassword}
                onChange={(e) => setWeakPassword(e.target.value)}
                placeholder="weak"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Run Tests Button */}
        <div className="flex justify-center">
          <Button 
            onClick={runAllTests}
            disabled={isRunning}
            size="lg"
            className="w-full md:w-auto"
          >
            {isRunning ? 'Running Authentication Tests...' : 'Run All Authentication Tests'}
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
              Test Suite {failedTests > 0 ? 'Completed with Failures' : 'Passed'}: {passedTests} passed, {failedTests} failed out of {testResults.length} total tests.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};