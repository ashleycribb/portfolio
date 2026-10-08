
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let isStorageError = false;

      try {
        if (this.state.error?.message) {
          const errorData = JSON.parse(this.state.error.message);
          if (errorData.error && errorData.error.includes("exceeds the maximum allowed size")) {
            errorMessage = "Your portfolio has become too large to save (exceeds 1MB). This usually happens when adding many high-resolution AI images. Please use the 'Optimize Portfolio' button in the editor to compress your images.";
            isStorageError = true;
          } else {
            errorMessage = errorData.error || errorMessage;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-stone-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-2xl font-serif text-stone-900 mb-4">Something went wrong</h1>
            <p className="text-stone-600 mb-8 leading-relaxed">
              {errorMessage}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-stone-900 text-white rounded-full font-bold hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Reload Application
              </button>
              <button
                onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.href = '/';
                }}
                className="w-full py-3 bg-stone-100 text-stone-600 rounded-full font-bold hover:bg-stone-200 transition-all flex items-center justify-center gap-2"
              >
                <Home size={18} />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
