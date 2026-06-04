'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  size?: 'sm' | 'md' | 'lg';
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = 'md',
}: EmptyStateProps) {
  const sizeMap = {
    sm: { py: 'py-10', iconSize: 'h-8 w-8', iconBox: 'p-3', title: 'text-sm', desc: 'text-xs' },
    md: { py: 'py-16', iconSize: 'h-10 w-10', iconBox: 'p-4', title: 'text-base', desc: 'text-sm' },
    lg: { py: 'py-24', iconSize: 'h-12 w-12', iconBox: 'p-5', title: 'text-lg', desc: 'text-sm' },
  };
  const s = sizeMap[size];

  return (
    <div className={`text-center ${s.py} rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 glass-panel`}>
      <div className={`inline-flex items-center justify-center ${s.iconBox} rounded-2xl bg-slate-800/60 border border-slate-700/50 mb-4`}>
        <Icon className={`${s.iconSize} text-slate-500`} />
      </div>
      <h3 className={`font-semibold text-slate-300 ${s.title}`}>{title}</h3>
      <p className={`mt-2 text-slate-500 max-w-sm mx-auto leading-relaxed ${s.desc}`}>{description}</p>
      {action && (
        <div className="mt-6">
          <button
            onClick={action.onClick}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            {action.icon && <action.icon className="mr-1.5 h-4 w-4" />}
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
}
