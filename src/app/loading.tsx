'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 p-6 relative select-none">
      {/* Dynamic blurred background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      
      <div className="relative flex items-center justify-center">
        {/* Spinner track */}
        <div className="w-12 h-12 rounded-full border-2 border-slate-900 absolute"></div>
        {/* Spinning indicator */}
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin relative z-10" />
      </div>
      
      <div className="space-y-1 text-center">
        <h3 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
          MetaForge
        </h3>
        <p className="text-xs text-slate-500 animate-pulse">
          Loading workspace components...
        </p>
      </div>
    </div>
  );
}
