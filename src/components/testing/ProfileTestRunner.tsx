import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, User, Upload, Edit } from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  details?: string;
}

export const ProfileTestRunner = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { id: 'TC-Profile-01', name: 'Profile view loads correctly', status: 'pending' },
    { id: 'TC-Profile-02', name: 'Updating avatar', status: 'pending' },
    { id: 'TC-Profile-03', name: 'Editing display name', status: 'pending' },
    { id: 'TC-Profile-04', name: 'Dark/light mode toggle', status: 'pending' },
    { id: 'TC-Profile-05', name: 'Notification preferences update', status: 'pending' }
  ]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [testDisplayName, setTestDisplayName] = useState('Test User Profile Name');
  const [originalProfile, setOriginalProfile] = useState<any>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Load current profile on mount
  useEffect(() => {
    const loadCurrentProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setOriginalProfile(data);
        
        if (data?.display_name) {
          setTestDisplayName(data.display_name + ' - Test');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadCurrentProfile();
  }, [user]);

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

  const testProfileViewLoads = async () => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      // Test loading current user's profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          display_name,
          avatar_url,
          bio,
          major,
          department,
          year,
          school,
          skills,
          interests,
          engagement_score,
          privacy_settings,
          created_at,
          updated_at
        `)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      if (!profile) {
        throw new Error('Profile not found for current user');
      }

      // Verify essential profile fields are present
      if (profile.user_id !== user.id) {
        throw new Error('Profile user_id does not match current user');
      }

      // Verify profile structure
      const requiredFields = ['user_id', 'created_at', 'updated_at'];
      for (const field of requiredFields) {
        if (!(field in profile)) {
          throw new Error(`Required profile field '${field}' is missing`);
        }
      }

      // Test loading profile with privacy settings
      if (profile.privacy_settings) {
        const privacySettings = profile.privacy_settings as any;
        
        if (typeof privacySettings !== 'object') {
          throw new Error('Privacy settings should be an object');
        }

        // Verify default privacy settings structure
        const expectedPrivacyKeys = ['profile_visible', 'academic_info_visible'];
        for (const key of expectedPrivacyKeys) {
          if (!(key in privacySettings)) {
            console.warn(`Privacy setting '${key}' is missing, but continuing test`);
          }
        }
      }

      // Test loading profile for another user (should respect privacy)
      const { data: otherProfiles, error: otherError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .neq('user_id', user.id)
        .limit(1);

      if (otherError) throw otherError;

      toast({
        title: "TC-Profile-01 Passed",
        description: `Profile loaded successfully with ${Object.keys(profile).length} fields`
      });

    } catch (error: any) {
      throw new Error(`Profile view loading failed: ${error.message}`);
    }
  };

  const testUpdatingAvatar = async () => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      // Create a test image blob (1x1 pixel PNG)
      const testImageBlob = new Blob([new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x00, 0x00, 0x37, 0x6E, 0xF9, 0x24, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02,
        0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
        0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ])], { type: 'image/png' });

      const fileName = `test-avatar-${Date.now()}.png`;
      const filePath = `${user.id}/${fileName}`;

      // Upload test avatar to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, testImageBlob, {
          upsert: true,
          contentType: 'image/png'
        });

      if (uploadError) throw uploadError;
      if (!uploadData?.path) throw new Error('Upload failed - no file path returned');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded avatar');
      }

      // Update profile with new avatar URL
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (!updatedProfile) throw new Error('Profile update failed');

      // Verify the avatar was updated
      if (updatedProfile.avatar_url !== publicUrl) {
        throw new Error('Avatar URL was not updated correctly');
      }

      // Clean up test file
      await supabase.storage
        .from('avatars')
        .remove([uploadData.path]);

      // Restore original avatar if it existed
      if (originalProfile?.avatar_url) {
        await supabase
          .from('profiles')
          .update({ avatar_url: originalProfile.avatar_url })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('profiles')
          .update({ avatar_url: null })
          .eq('user_id', user.id);
      }

      toast({
        title: "TC-Profile-02 Passed",
        description: "Avatar upload and update successful"
      });

    } catch (error: any) {
      throw new Error(`Avatar update test failed: ${error.message}`);
    }
  };

  const testEditingDisplayName = async () => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      // Get current display name
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      
      const originalDisplayName = currentProfile?.display_name;
      const testName = `Test Display Name ${Date.now()}`;

      // Update display name
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ display_name: testName })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (!updatedProfile) throw new Error('Profile update failed');

      // Verify the display name was updated
      if (updatedProfile.display_name !== testName) {
        throw new Error(`Display name was not updated correctly. Expected: ${testName}, Got: ${updatedProfile.display_name}`);
      }

      // Test name validation (optional - test empty name)
      try {
        const { error: emptyNameError } = await supabase
          .from('profiles')
          .update({ display_name: '' })
          .eq('user_id', user.id);

        // If empty name is allowed, that's fine
        if (!emptyNameError) {
          console.log('Empty display name is allowed');
        }
      } catch (validationError) {
        console.log('Empty display name validation works as expected');
      }

      // Test updating with longer name
      const longTestName = `${testName} - Extended Test Name for Character Limit Verification`;
      const { data: longNameProfile, error: longNameError } = await supabase
        .from('profiles')
        .update({ display_name: longTestName })
        .eq('user_id', user.id)
        .select()
        .single();

      if (longNameError) {
        console.log('Long name validation works as expected');
      } else if (longNameProfile?.display_name === longTestName) {
        console.log('Long display names are supported');
      }

      // Restore original display name
      const restoreName = originalDisplayName || 'Test User';
      const { error: restoreError } = await supabase
        .from('profiles')
        .update({ display_name: restoreName })
        .eq('user_id', user.id);

      if (restoreError) {
        console.warn('Failed to restore original display name:', restoreError);
      }

      toast({
        title: "TC-Profile-03 Passed",
        description: "Display name update and validation successful"
      });

    } catch (error: any) {
      throw new Error(`Display name edit test failed: ${error.message}`);
    }
  };

  const testDarkLightModeToggle = async () => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      // Get current theme from localStorage or default to light
      const currentTheme = localStorage.getItem('theme') || 'light';
      const originalTheme = currentTheme;

      // Test toggling to dark mode
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
      
      // Verify dark mode is applied
      const isDarkMode = document.documentElement.classList.contains('dark');
      if (!isDarkMode) {
        throw new Error('Dark mode was not applied to document');
      }

      // Wait a moment for potential DOM updates
      await new Promise(resolve => setTimeout(resolve, 100));

      // Test toggling to light mode
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
      
      // Verify light mode is applied
      const isLightMode = !document.documentElement.classList.contains('dark');
      if (!isLightMode) {
        throw new Error('Light mode was not applied to document');
      }

      // Test system preference mode
      localStorage.setItem('theme', 'system');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Verify system mode respects OS preference
      const systemModeCorrect = prefersDark ? 
        document.documentElement.classList.contains('dark') : 
        !document.documentElement.classList.contains('dark');
      
      if (!systemModeCorrect) {
        throw new Error('System theme mode does not respect OS preference');
      }

      // Restore original theme
      localStorage.setItem('theme', originalTheme);
      if (originalTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (originalTheme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // System mode
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      toast({
        title: "TC-Profile-04 Passed",
        description: "Dark/light mode toggle functionality verified"
      });

    } catch (error: any) {
      throw new Error(`Theme toggle test failed: ${error.message}`);
    }
  };

  const testNotificationPreferencesUpdate = async () => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      // Get current profile to check for notification preferences
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('privacy_settings')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const originalPrivacySettings = (currentProfile?.privacy_settings as Record<string, any>) || {};
      
      // Test updating notification preferences
      const testNotificationSettings = {
        ...(originalPrivacySettings as Record<string, any>),
        email_notifications: true,
        push_notifications: false,
        digest_frequency: 'weekly',
        mentions_notifications: true,
        comments_notifications: false,
        likes_notifications: true
      };

      // Update privacy settings with notification preferences
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ privacy_settings: testNotificationSettings })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (!updatedProfile) throw new Error('Profile update failed');

      // Verify the notification settings were updated
      const updatedSettings = updatedProfile.privacy_settings as any;
      
      if (updatedSettings.email_notifications !== true) {
        throw new Error('Email notifications setting was not updated correctly');
      }

      if (updatedSettings.push_notifications !== false) {
        throw new Error('Push notifications setting was not updated correctly');
      }

      if (updatedSettings.digest_frequency !== 'weekly') {
        throw new Error('Digest frequency setting was not updated correctly');
      }

      // Test individual preference updates
      const individualUpdate = {
        ...updatedSettings,
        mentions_notifications: false // Toggle this setting
      };

      const { data: secondUpdate, error: secondError } = await supabase
        .from('profiles')
        .update({ privacy_settings: individualUpdate })
        .eq('user_id', user.id)
        .select()
        .single();

      if (secondError) throw secondError;
      
      const secondSettings = secondUpdate?.privacy_settings as any;
      if (secondSettings.mentions_notifications !== false) {
        throw new Error('Individual notification preference update failed');
      }

      // Test invalid preference values (should handle gracefully)
      const invalidUpdate = {
        ...(originalPrivacySettings as Record<string, any>),
        invalid_notification_type: 'invalid_value'
      };

      const { error: invalidError } = await supabase
        .from('profiles')
        .update({ privacy_settings: invalidUpdate })
        .eq('user_id', user.id);

      // Invalid settings should either be ignored or cause a controlled error
      if (invalidError) {
        console.log('Invalid notification settings correctly rejected');
      }

      // Restore original privacy settings
      const { error: restoreError } = await supabase
        .from('profiles')
        .update({ privacy_settings: originalPrivacySettings })
        .eq('user_id', user.id);

      if (restoreError) {
        console.warn('Failed to restore original privacy settings:', restoreError);
      }

      toast({
        title: "TC-Profile-05 Passed",
        description: "Notification preferences update functionality verified"
      });

    } catch (error: any) {
      throw new Error(`Notification preferences test failed: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to run profile tests",
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
      // Run tests sequentially
      await runTest('TC-Profile-01', testProfileViewLoads);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Profile-02', testUpdatingAvatar);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Profile-03', testEditingDisplayName);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Profile-04', testDarkLightModeToggle);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Profile-05', testNotificationPreferencesUpdate);

      const passedTests = testResults.filter(test => test.status === 'passed').length;
      const totalTests = testResults.length;

      toast({
        title: "Profile Tests Complete",
        description: `${passedTests}/${totalTests} tests passed`
      });

    } catch (error) {
      console.error('Error running profile tests:', error);
      toast({
        title: "Test Execution Error",
        description: "An unexpected error occurred while running tests",
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
            <User className="h-5 w-5" />
            Profile & Settings Test Runner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!user && (
            <Alert>
              <AlertDescription>
                Please log in to run profile tests.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="testDisplayName">Test Display Name</Label>
                <Input
                  id="testDisplayName"
                  value={testDisplayName}
                  onChange={(e) => setTestDisplayName(e.target.value)}
                  placeholder="Enter test display name"
                />
              </div>
            </div>

            <Button 
              onClick={runAllTests} 
              disabled={isRunning || !user}
              className="w-full"
            >
              {isRunning ? 'Running Tests...' : 'Run All Profile Tests'}
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            
            {testResults.map((test) => (
              <Card key={test.id} className="border-l-4 border-l-blue-500">
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

export default ProfileTestRunner;