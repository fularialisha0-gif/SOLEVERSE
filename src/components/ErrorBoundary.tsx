import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Unexpected application error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090A0D] text-[#F4F6FA] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#111318] border border-white/10 rounded-xl p-8">
            <p className="text-xs tracking-widest uppercase text-[#A1AAB8] mb-2">Application Notice</p>
            <h2 className="font-display text-2xl font-semibold mb-3">Something interrupted this view</h2>
            <p className="text-sm text-[#A1AAB8] mb-6 break-words">{this.state.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Reload Storefront
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
