
import React from 'react';
import { EnhancedCard } from '@/components/ui/enhanced-card';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <EnhancedCard className="max-w-md w-full">
            <div className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Something went wrong
                </h2>
                <p className="text-sm text-muted-foreground">
                  We encountered an unexpected error. Please try refreshing the page.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left">
                  <summary className="cursor-pointer text-sm font-medium">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 justify-center">
                <EnhancedButton
                  onClick={this.handleRetry}
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </EnhancedButton>
                
                <EnhancedButton
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Refresh Page
                </EnhancedButton>
              </div>
            </div>
          </EnhancedCard>
        </div>
      );
    }

    return this.props.children;
  }
}
