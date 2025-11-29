import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const CommentDebugTest: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebugTest = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user:', user);
      console.log('User error:', userError);

      if (!user) {
        setDebugInfo({ error: 'No user found' });
        return;
      }

      // Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      console.log('Profile data:', profile);
      console.log('Profile error:', profileError);

      // Check if user has a profile by user_id
      const { data: profileByUserId, error: profileByUserIdError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Profile by user_id:', profileByUserId);
      console.log('Profile by user_id error:', profileByUserIdError);

      // Check all profiles
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);

      console.log('All profiles:', allProfiles);
      console.log('All profiles error:', allProfilesError);

      setDebugInfo({
        user,
        userError,
        profile,
        profileError,
        profileByUserId,
        profileByUserIdError,
        allProfiles,
        allProfilesError
      });
    } catch (error) {
      console.error('Debug test error:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4">Comment Debug Test</h3>
      
      <button
        onClick={runDebugTest}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Running...' : 'Run Debug Test'}
      </button>

      {debugInfo && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Debug Results:</h4>
          <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};





















