'use client';

import React from 'react';
import { FieldDefinition } from '@/types';
import { Calendar, CheckSquare, List, Type, FileText } from 'lucide-react';

interface DetailRendererProps {
  fields: FieldDefinition[];
  recordData: Record<string, any>;
}

export default function DetailRenderer({ fields = [], recordData = {} }: DetailRendererProps) {
  
  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'checkbox':
        return <CheckSquare className="h-4 w-4 text-blue-500" />;
      case 'date':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'select':
        return <List className="h-4 w-4 text-blue-500" />;
      case 'textarea':
        return <FileText className="h-4 w-4 text-blue-500" />;
      default:
        return <Type className="h-4 w-4 text-blue-500" />;
    }
  };

  const renderValue = (val: any, type: string) => {
    if (val === undefined || val === null || val === '') {
      return <span className="text-slate-650 italic">Empty</span>;
    }

    if (type === 'checkbox') {
      const boolVal = String(val) === 'true' || val === true;
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            boolVal ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30' : 'bg-slate-800/40 text-slate-400 border border-slate-700/30'
          }`}
        >
          {boolVal ? 'Yes' : 'No'}
        </span>
      );
    }

    if (type === 'date') {
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return <span>{d.toLocaleDateString(undefined, { dateStyle: 'long' })}</span>;
        }
      } catch (e) {
        // Fallback
      }
    }

    if (type === 'number') {
      return <span className="font-mono">{Number(val).toLocaleString()}</span>;
    }

    return <span className="whitespace-pre-wrap">{String(val)}</span>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {fields.length === 0 && (
        <div className="col-span-2 text-center py-6 text-slate-500">
          No schema fields available.
        </div>
      )}

      {fields.map((field) => {
        const val = recordData[field.name];

        return (
          <div
            key={field.name}
            className="p-4 rounded-lg border border-slate-800 bg-slate-900/20 flex flex-col space-y-2 hover:border-slate-750 transition-colors"
          >
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {getFieldIcon(field.type)}
              <span>{field.name}</span>
            </div>
            <div className="text-sm font-medium text-slate-100 pl-6">
              {renderValue(val, field.type)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
