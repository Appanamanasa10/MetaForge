'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error securely to production tracking systems or console
    console.error('Unhandled Application Crash:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative selection:bg-red-500/20">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/5 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md bg-slate-900/40 border border-slate-850 p-8 rounded-2xl shadow-xl backdrop-blur-xl space-y-6 glass-panel text-center">
        
        {/* Warning Icon */}
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-550/10 border border-red-500/20 text-red-400">
          <AlertTriangle className="h-6 w-6" />
        </div>

        {/* Error Headers */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Something went wrong</h2>
          <p className="text-sm text-slate-400">
            An unexpected error occurred during execution. We have logged the details.
          </p>
        </div>

        {/* Secure diagnostic box (collapsible or small) */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-lg text-left">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Diagnostic Message
          </div>
          <div className="text-xs font-mono text-red-300 break-all">
            {error.message || 'Unknown application error'}
          </div>
          {error.digest && (
            <div className="mt-2 text-[10px] text-slate-600 font-mono">
              Digest ID: {error.digest}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex justify-center items-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-650 hover:bg-blue-600 text-white transition-all cursor-pointer shadow-lg shadow-blue-500/10"
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Try again
          </button>
          
          <Link
            href="/dashboard"
            className="flex-1 inline-flex justify-center items-center px-4 py-2.5 rounded-lg text-sm font-semibold border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900 transition-all"
          >
            <Home className="mr-1.5 h-4 w-4" />
            Dashboard
          </Link>
        </div>

        {/* Back Link */}
        <p className="text-xs text-slate-500 pt-2">
          If this issue persists, please contact support or check system status.
        </p>
      </div>
    </div>
  );
}
