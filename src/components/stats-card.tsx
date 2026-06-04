'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'blue' | 'indigo' | 'emerald' | 'amber';
  isLoading?: boolean;
  sublabel?: string;
}

const colorMap = {
  blue: {
    icon: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    value: 'text-blue-300',
  },
  indigo: {
    icon: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    value: 'text-indigo-300',
  },
  emerald: {
    icon: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    value: 'text-emerald-300',
  },
  amber: {
    icon: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    value: 'text-amber-300',
  },
};

export default function StatsCard({
  label,
  value,
  icon: Icon,
  color = 'blue',
  isLoading = false,
  sublabel,
}: StatsCardProps) {
  const c = colorMap[color];

  if (isLoading) {
    return (
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20 glass-panel space-y-3 animate-pulse">
        <div className="h-4 w-24 bg-slate-800 rounded" />
        <div className="h-8 w-16 bg-slate-800 rounded" />
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20 glass-panel hover:border-slate-700 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-bold tracking-tight ${c.value}`}>
            {value}
          </p>
          {sublabel && (
            <p className="text-xs text-slate-500">{sublabel}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl border ${c.bg}`}>
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}
