import React, { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { SecurityUtils } from '../../utils/security.ts';

interface IErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface IErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  showDetails?: boolean;
  resetOnPropsChange?: boolean;
}

interface IErrorDisplayProps {
  error: Error;
  errorInfo: ErrorInfo;
  errorId: string;
  showDetails: boolean;
  onReset: () => void;
}

const ErrorDisplay: React.FC<IErrorDisplayProps> = ({ 
  error, 
  errorInfo, 
  errorId, 
  showDetails, 
  onReset 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
    <div className="max-w-md w-full mx-4">
      <div className="bg-white rounded-lg shadow-xl p-6 border border-red-200">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg 
              className="h-8 w-8 text-red-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Something went wrong
            </h3>
            <p className="text-sm text-gray-500">
              An unexpected error occurred while loading this page.
            </p>
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={onReset}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
          >
            Try again
          </button>
        </div>

        {showDetails && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              Show error details
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded-md text-xs font-mono">
              <p className="font-semibold text-gray-700 mb-2">Error ID: {errorId}</p>
              <p className="text-red-600 mb-2">{error.name}: {error.message}</p>
              {error.stack && (
                <pre className="whitespace-pre-wrap text-gray-600 overflow-auto max-h-32">
                  {SecurityUtils.escapeHtml(error.stack)}
                </pre>
              )}
              {errorInfo.componentStack && (
                <div className="mt-2">
                  <p className="font-semibold text-gray-700 mb-1">Component Stack:</p>
                  <pre className="whitespace-pre-wrap text-gray-600 overflow-auto max-h-32">
                    {SecurityUtils.escapeHtml(errorInfo.componentStack)}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  </div>
);

export class ErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<IErrorBoundaryState> {
    const errorId = SecurityUtils.generateCSRFToken().substring(0, 8);
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorId = this.state.errorId || SecurityUtils.generateCSRFToken().substring(0, 8);
    
    this.setState({
      errorInfo,
      errorId
    });

    // Log error securely (sanitize any user input)
    console.error('Error Boundary caught an error:', {
      errorId,
      name: error.name,
      message: SecurityUtils.sanitizeText(error.message),
      stack: error.stack ? SecurityUtils.sanitizeText(error.stack) : undefined,
      componentStack: errorInfo.componentStack ? 
        SecurityUtils.sanitizeText(errorInfo.componentStack) : undefined,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo, errorId);
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError);
      }
    }

    // Send error to monitoring service (if configured)
    this.reportError(error, errorInfo, errorId);
  }

  override componentDidUpdate(prevProps: IErrorBoundaryProps): void {
    if (this.props.resetOnPropsChange && prevProps.children !== this.props.children) {
      if (this.state.hasError) {
        this.resetErrorBoundary();
      }
    }
  }

  override componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo, errorId: string): Promise<void> => {
    try {
      // Only report in production
      if (import.meta.env.PROD && import.meta.env.VITE_ERROR_REPORTING_URL) {
        const payload = {
          errorId,
          name: error.name,
          message: SecurityUtils.sanitizeText(error.message),
          stack: error.stack ? SecurityUtils.sanitizeText(error.stack) : undefined,
          componentStack: errorInfo.componentStack ? 
            SecurityUtils.sanitizeText(errorInfo.componentStack) : undefined,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          appVersion: import.meta.env.VITE_APP_VERSION || 'unknown'
        };

        await fetch(import.meta.env.VITE_ERROR_REPORTING_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleReset = (): void => {
    this.resetErrorBoundary();
    
    // Optional: reload page after a short delay if error persists
    this.resetTimeoutId = window.setTimeout(() => {
      if (this.state.hasError) {
        window.location.reload();
      }
    }, 100);
  };

  override render(): ReactNode {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error display
      return (
        <ErrorDisplay
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          showDetails={this.props.showDetails ?? !import.meta.env.PROD}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<IErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for throwing errors in functional components (for testing)
export function useErrorHandler() {
  return (error: Error, _errorInfo?: Partial<ErrorInfo>) => {
    throw error;
  };
}

// Custom hook for error reporting
export function useErrorReporting() {
  const reportError = React.useCallback(
    async (error: Error, context?: Record<string, any>) => {
      try {
        const errorId = SecurityUtils.generateCSRFToken().substring(0, 8);
        
        console.error('Manual error report:', {
          errorId,
          name: error.name,
          message: SecurityUtils.sanitizeText(error.message),
          stack: error.stack ? SecurityUtils.sanitizeText(error.stack) : undefined,
          context: context ? SecurityUtils.sanitizeText(JSON.stringify(context)) : undefined,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : 'unknown'
        });

        // Report to monitoring service if configured
        if (import.meta.env.PROD && import.meta.env.VITE_ERROR_REPORTING_URL) {
          await fetch(import.meta.env.VITE_ERROR_REPORTING_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              errorId,
              name: error.name,
              message: SecurityUtils.sanitizeText(error.message),
              stack: error.stack ? SecurityUtils.sanitizeText(error.stack) : undefined,
              context,
              timestamp: new Date().toISOString(),
              url: window.location.href,
              userAgent: navigator.userAgent,
              appVersion: import.meta.env.VITE_APP_VERSION || 'unknown'
            })
          });
        }
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError);
      }
    },
    []
  );

  return { reportError };
}

export default ErrorBoundary;