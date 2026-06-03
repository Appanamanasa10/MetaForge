'use client';

import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RotateCcw } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="p-6 rounded-lg border border-red-500/30 bg-red-950/20 text-red-200 glass-panel">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-lg font-semibold text-red-300">Rendering Error</h3>
          <p className="mt-1 text-sm text-red-400 font-mono">
            {error.message || 'An unexpected error occurred in this runtime component.'}
          </p>
          <div className="mt-4 flex items-center space-x-4">
            <button
              onClick={resetErrorBoundary}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 text-red-200 transition-colors"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Try Again
            </button>
            <span className="text-xs text-red-400/70">
              Check the JSON configuration for invalid values or unsupported components.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RuntimeErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset local state if needed
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
