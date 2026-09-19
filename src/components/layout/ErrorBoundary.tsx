import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  isPageLevel?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Burra Pariksha CMS - Uncaught error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public handleRetryPage = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (this.props.isPageLevel) {
        return (
          <div className="w-full py-12 flex items-center justify-center p-4">
            <div className="max-w-md w-full p-6 bg-white border border-slate-200 rounded-xl shadow-xs text-center space-y-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Page Error</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                An unexpected error occurred while rendering this page. The application shell and navigation remain functional.
              </p>
              {this.state.error && (
                <pre className="p-3 bg-slate-900 text-rose-300 text-[11px] rounded-lg text-left overflow-x-auto font-mono">
                  {this.state.error.message}
                </pre>
              )}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleReset}
                  className="flex-1 text-xs"
                >
                  Reload App
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={RefreshCw}
                  onClick={this.handleRetryPage}
                  className="flex-1 text-xs"
                >
                  Retry Page
                </Button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-900">
          <div className="max-w-md w-full p-8 bg-white border border-slate-200 rounded-xl shadow-lg text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Application Error</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              An unexpected error occurred in the Burra Pariksha CMS interface.
            </p>
            {this.state.error && (
              <pre className="p-3 bg-slate-900 text-rose-300 text-[11px] rounded-lg text-left overflow-x-auto font-mono">
                {this.state.error.message}
              </pre>
            )}
            <Button
              variant="primary"
              size="md"
              icon={RefreshCw}
              onClick={this.handleReset}
              className="w-full mt-2"
            >
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}



