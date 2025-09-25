
import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId: string;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorId: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: Math.random().toString(36).substring(7)
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Something went wrong
              </CardTitle>
              <CardDescription>
                An unexpected error occurred. We've been notified and are working on a fix.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4 p-3 bg-muted rounded text-sm font-mono text-xs overflow-auto">
                  <p className="font-semibold text-destructive">Error:</p>
                  <p>{this.state.error.message}</p>
                  {this.state.error.stack && (
                    <>
                      <p className="font-semibold text-destructive mt-2">Stack:</p>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </>
                  )}
                </div>
              )}
              <div className="mt-4 p-3 bg-muted rounded">
                <p className="text-sm text-muted-foreground">
                  Error ID: <code className="font-mono">{this.state.errorId}</code>
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={this.handleRetry} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.handleReload} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
