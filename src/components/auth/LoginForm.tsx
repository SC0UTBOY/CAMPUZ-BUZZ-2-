
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn, resetPassword, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      setShowResetDialog(false);
      setResetEmail('');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@college.edu"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <DialogTrigger asChild>
              <Button variant="link" className="p-0 h-auto text-sm">
                Forgot password?
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Email Address</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your.email@college.edu"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>
    </>
  );
};
