
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdvancedRateLimit } from '@/hooks/useAdvancedRateLimit';
import { usePasswordSecurity } from '@/hooks/usePasswordSecurity';
import { PasswordSecurityIndicator } from '@/components/security/PasswordSecurityIndicator';

export const EnhancedLoginForm: React.FC = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { checkRateLimit, state: rateLimitState } = useAdvancedRateLimit({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
    progressiveDelay: true,
    identifier: `login_${email}`
  });

  const { checkPasswordStrength } = usePasswordSecurity();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check rate limit
    const rateLimitResult = checkRateLimit();
    if (!rateLimitResult.allowed) {
      setError(`Too many login attempts. Try again in ${rateLimitResult.retryAfter} seconds.`);
      return;
    }

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      await signIn(email, password);
      // Success - redirect handled by AuthContext
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Secure Login
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || rateLimitState.isBlocked}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || rateLimitState.isBlocked}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Rate limiting info */}
          {rateLimitState.attempts > 0 && (
            <div className="text-sm text-muted-foreground">
              Login attempts: {rateLimitState.attempts} / 5
              {rateLimitState.remainingAttempts < 3 && rateLimitState.remainingAttempts > 0 && (
                <span className="text-yellow-600 ml-2">
                  {rateLimitState.remainingAttempts} attempts remaining
                </span>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || rateLimitState.isBlocked || !email || !password}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          {rateLimitState.isBlocked && rateLimitState.nextAttemptAt && (
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Account temporarily locked due to too many failed attempts. 
                Try again after {rateLimitState.nextAttemptAt.toLocaleTimeString()}.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
