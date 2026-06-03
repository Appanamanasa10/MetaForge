'use client';

import React from 'react';
import { FieldDefinition } from '@/types';
import { Edit2, Trash2, Eye, Search, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface TableRendererProps {
  fields: FieldDefinition[];
  records: { id: string; data: Record<string, any>; createdAt: string }[];
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function TableRenderer({
  fields = [],
  records = [],
  onView,
  onEdit,
  onDelete,
  isLoading = false,
  search,
  onSearchChange,
  page,
  totalPages,
  onPageChange,
}: TableRendererProps) {
  
  // Format cell value depending on defined field type
  const formatCellValue = (value: any, type: string) => {
    if (value === undefined || value === null || value === '') {
      return <span className="text-slate-600">-</span>;
    }

    if (type === 'checkbox') {
      const boolVal = String(value) === 'true' || value === true;
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
            boolVal ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30' : 'bg-slate-800/40 text-slate-400 border border-slate-700/30'
          }`}
        >
          {boolVal ? 'Yes' : 'No'}
        </span>
      );
    }

    if (type === 'date') {
      try {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          return <span>{d.toLocaleDateString()}</span>;
        }
      } catch (e) {
        // Fallback
      }
    }

    if (type === 'number') {
      return <span className="font-mono">{Number(value).toLocaleString()}</span>;
    }

    const text = String(value);
    if (text.length > 50) {
      return <span title={text}>{text.slice(0, 47)}...</span>;
    }

    return <span>{text}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Table Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-700 transition-all text-sm"
          />
        </div>
      </div>

      {/* Grid container with overflow-x */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/40 glass-panel">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60">
              {fields.map((f) => (
                <th key={f.name} className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {f.name.charAt(0).toUpperCase() + f.name.slice(1)}
                </th>
              ))}
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  {fields.map((f) => (
                    <td key={f.name} className="px-6 py-4">
                      <div className="h-4 bg-slate-800 rounded animate-pulse w-3/4"></div>
                    </td>
                  ))}
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <div className="h-7 w-7 bg-slate-800 rounded animate-pulse"></div>
                    <div className="h-7 w-7 bg-slate-800 rounded animate-pulse"></div>
                  </td>
                </tr>
              ))
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={fields.length + 1} className="px-6 py-10 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <AlertCircle className="h-6 w-6 text-slate-600" />
                    <span>No records found.</span>
                  </div>
                </td>
              </tr>
            ) : (
              records.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/20 transition-colors">
                  {fields.map((f) => (
                    <td key={f.name} className="px-6 py-3.5 text-sm text-slate-300 whitespace-nowrap">
                      {formatCellValue(row.data[f.name], f.type)}
                    </td>
                  ))}
                  <td className="px-6 py-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center space-x-2">
                      {onView && (
                        <button
                          onClick={() => onView(row.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {!isLoading && records.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/20 border border-slate-850 rounded-lg text-sm text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{records.length}</span> records
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>
              Page <span className="font-semibold text-slate-200">{page}</span> of{' '}
              <span className="font-semibold text-slate-200">{totalPages || 1}</span>
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
