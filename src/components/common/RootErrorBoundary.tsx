
import React, { Component, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Root Error Boundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log to analytics or error reporting service
    if (typeof window !== 'undefined') {
      // Store error info for debugging
      localStorage.setItem('lastError', JSON.stringify({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      }));
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <AlertTriangle className="h-16 w-16 text-destructive" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Something went wrong
                </h1>
                <p className="text-muted-foreground mb-4">
                  We encountered an unexpected error. This has been logged for investigation.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left bg-muted p-3 rounded-md">
                  <summary className="cursor-pointer text-sm font-medium mb-2">
                    Error Details (Development Mode)
                  </summary>
                  <pre className="text-xs overflow-auto max-h-40">
                    <strong>Error:</strong> {this.state.error.message}
                    {this.state.error.stack && (
                      <>
                        <br /><br />
                        <strong>Stack:</strong>
                        <br />{this.state.error.stack}
                      </>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        <br /><br />
                        <strong>Component Stack:</strong>
                        <br />{this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleRetry} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                
                <Button onClick={this.handleGoHome} variant="outline" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
                
                <Button onClick={this.handleReload} variant="secondary">
                  Reload App
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
