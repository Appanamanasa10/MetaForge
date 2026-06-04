'use client';

import React from 'react';
import { FieldDefinition } from '@/types';
import { Edit2, Trash2, Eye, Search, ChevronLeft, ChevronRight, Download, Database } from 'lucide-react';
import Papa from 'papaparse';

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
  entityName?: string;
  totalRecords?: number;
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
  entityName = 'Record',
  totalRecords,
}: TableRendererProps) {

  const formatCellValue = (value: any, type: string) => {
    if (value === undefined || value === null || value === '') {
      return <span className="text-slate-600 italic text-xs">—</span>;
    }

    if (type === 'checkbox') {
      const boolVal = String(value) === 'true' || value === true;
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
            boolVal ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30' : 'bg-slate-800/40 text-slate-400 border border-slate-700/30'
          }`}
        >
          {boolVal ? '✓ Yes' : '✗ No'}
        </span>
      );
    }

    if (type === 'date') {
      try {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          return <span className="text-slate-300">{d.toLocaleDateString()}</span>;
        }
      } catch (e) {}
    }

    if (type === 'number') {
      return <span className="font-mono text-blue-300">{Number(value).toLocaleString()}</span>;
    }

    if (type === 'email') {
      return <span className="text-blue-400 font-mono text-xs">{String(value)}</span>;
    }

    const text = String(value);
    if (text.length > 50) {
      return <span title={text} className="cursor-help">{text.slice(0, 47)}…</span>;
    }

    return <span>{text}</span>;
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const csvData = records.map((row) => {
      const flat: Record<string, any> = { id: row.id, createdAt: new Date(row.createdAt).toLocaleString() };
      fields.forEach((f) => {
        flat[f.name] = row.data[f.name] ?? '';
      });
      return flat;
    });
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entityName.toLowerCase().replace(/\s+/g, '-')}-records.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Table Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder={`Search ${entityName} records...`}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-700 transition-all text-sm"
          />
        </div>

        {records.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3.5 py-2 border border-slate-800 bg-slate-900/40 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-all cursor-pointer shrink-0"
            title="Export to CSV"
          >
            <Download className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
            Export CSV
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40 glass-panel">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/70">
              {fields.map((f) => (
                <th key={f.name} className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  {f.name.charAt(0).toUpperCase() + f.name.slice(1)}
                </th>
              ))}
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                Created
              </th>
              {(onView || onEdit || onDelete) && (
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right whitespace-nowrap">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  {fields.map((f) => (
                    <td key={f.name} className="px-5 py-4">
                      <div className="h-4 skeleton rounded-md w-3/4" />
                    </td>
                  ))}
                  <td className="px-5 py-4">
                    <div className="h-4 skeleton rounded-md w-20" />
                  </td>
                  {(onView || onEdit || onDelete) && (
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <div className="h-7 w-7 skeleton rounded-lg" />
                        <div className="h-7 w-7 skeleton rounded-lg" />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={fields.length + 2} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                      <Database className="h-8 w-8 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold text-sm">No {entityName} records</p>
                      <p className="text-slate-600 text-xs mt-1">
                        {search ? `No results for "${search}"` : 'Add your first record to get started.'}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              records.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/20 transition-colors group">
                  {fields.map((f) => (
                    <td key={f.name} className="px-5 py-3.5 text-sm text-slate-300">
                      {formatCellValue(row.data[f.name], f.type)}
                    </td>
                  ))}
                  <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>
                  {(onView || onEdit || onDelete) && (
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        {onView && (
                          <button
                            onClick={() => onView(row.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-950/30 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {!isLoading && (records.length > 0 || totalRecords !== undefined) && (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/30 border border-slate-800 rounded-xl text-sm text-slate-400">
          <div className="text-xs">
            {totalRecords !== undefined ? (
              <>
                Showing <span className="font-semibold text-slate-200">{records.length}</span> of{' '}
                <span className="font-semibold text-slate-200">{totalRecords}</span> records
              </>
            ) : (
              <>
                <span className="font-semibold text-slate-200">{records.length}</span> records
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="font-semibold text-slate-200">{page}</span>
              <span className="text-slate-600"> / </span>
              <span className="font-semibold text-slate-200">{totalPages || 1}</span>
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
