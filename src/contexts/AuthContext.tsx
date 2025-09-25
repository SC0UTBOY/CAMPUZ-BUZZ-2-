
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const logSecurityEvent = async (eventType: string, metadata: any = {}) => {
  try {
    const { error } = await supabase
      .from('security_events')
      .insert({
        event_type: eventType,
        metadata,
        ip_address: '127.0.0.1', // In production, get real IP
        user_agent: navigator.userAgent
      });
    
    if (error) console.error('Security event log error:', error);
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

const validatePasswordStrength = (password: string): { isStrong: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) errors.push('Password must be at least 8 characters long');
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Password must contain at least one special character');
  
  return { isStrong: errors.length === 0, errors };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            createOrUpdateProfile(session.user);
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const createOrUpdateProfile = async (user: User) => {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User',
            role: 'student',
            engagement_score: 0,
            privacy_settings: {
              email_visible: false,
              profile_visible: true,
              academic_info_visible: true,
              notifications: {
                posts: true,
                comments: true,
                mentions: true,
                messages: true,
                events: true
              }
            }
          });

        if (error) throw error;
        console.log('Profile created successfully');
      }
    } catch (error) {
      console.error('Error creating/updating profile:', error);
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      const validation = validatePasswordStrength(password);
      if (!validation.isStrong) {
        throw new Error(validation.errors.join(', '));
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });

      if (error) throw error;

      await logSecurityEvent('user_signup_attempt', { email });

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account."
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      await logSecurityEvent('user_signup_failed', { error: error.message });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      await logSecurityEvent('user_signin_success', { email });

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully."
      });
    } catch (error: any) {
      console.error('Signin error:', error);
      await logSecurityEvent('user_signin_failed', { error: error.message });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      await logSecurityEvent('user_signout');

      toast({
        title: "Signed out",
        description: "You have been signed out successfully."
      });
    } catch (error: any) {
      console.error('Signout error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) throw error;

      await logSecurityEvent('password_reset_requested', { email });

      toast({
        title: "Reset email sent",
        description: "Please check your email for password reset instructions."
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
