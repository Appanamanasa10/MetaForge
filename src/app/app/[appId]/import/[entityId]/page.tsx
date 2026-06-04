'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import RuntimeErrorBoundary from '@/components/runtime/error-boundary';
import { FieldDefinition } from '@/types';
import {
  Upload,
  ArrowLeft,
  Loader2,
  Table,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CloudUpload
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Papa from 'papaparse';

const STEPS = [
  { num: 1, label: 'Upload File' },
  { num: 2, label: 'Map Columns' },
  { num: 3, label: 'Import Summary' },
];

type PreflightRow = { rowIndex: number; mapped: Record<string, any>; issues: string[] };

export default function CSVImportPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const appId = params.appId as string;
  const entityId = params.entityId as string;

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [importSummary, setImportSummary] = useState<any | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreflight, setShowPreflight] = useState(false);

  const { data: application, isLoading: isAppLoading } = useQuery<any>({
    queryKey: ['application', appId],
    queryFn: async () => {
      const res = await fetch('/api/applications');
      const data = await res.json();
      return data.data.find((a: any) => a.id === appId);
    }
  });

  const { data: entities = [], isLoading: isEntitiesLoading } = useQuery<any[]>({
    queryKey: ['entities', appId],
    queryFn: async () => {
      const res = await fetch('/api/applications');
      const data = await res.json();
      const app = data.data.find((a: any) => a.id === appId);
      return app ? app.entities : [];
    }
  });

  const currentEntity = entities.find((e) => e.id === entityId);
  const schema = currentEntity?.schemaJson;
  const fields: FieldDefinition[] = schema?.fields || [];

  const parseFile = (file: File) => {
    setCsvFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        setCsvRows(results.data);

        const initialMap: Record<string, string> = {};
        fields.forEach((field) => {
          const matchedHeader = headers.find(
            (h) => h.toLowerCase().trim() === field.name.toLowerCase().trim()
          );
          initialMap[field.name] = matchedHeader || '';
        });

        setColumnMap(initialMap);
        setStep(2);
        toast.success(`Parsed ${results.data.length} rows from "${file.name}"`);
      },
      error: () => toast.error('Failed to parse CSV file. Ensure it is a valid format.'),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      parseFile(file);
    } else {
      toast.error('Please drop a valid .csv file.');
    }
  }, [fields]);

  const handleMapChange = (fieldName: string, headerName: string) => {
    setColumnMap((prev) => ({ ...prev, [fieldName]: headerName }));
  };

  // Pre-flight validation check
  const runPreflight = (): PreflightRow[] => {
    return csvRows.map((row, idx) => {
      const mapped: Record<string, any> = {};
      const issues: string[] = [];

      fields.forEach((field) => {
        const csvCol = columnMap[field.name];
        if (csvCol && row[csvCol] !== undefined) {
          const rawVal = row[csvCol];
          if (field.type === 'checkbox') {
            mapped[field.name] = String(rawVal).toLowerCase().trim() === 'true' || rawVal === true || rawVal === 1 || String(rawVal).trim() === 'yes';
          } else {
            mapped[field.name] = rawVal;
          }
        }

        if (field.required && (!columnMap[field.name] || !row[columnMap[field.name]])) {
          issues.push(`"${field.name}" is required but empty`);
        }
      });

      return { rowIndex: idx + 1, mapped, issues };
    });
  };

  const importMutation = useMutation({
    mutationFn: async (mappedData: any[]) => {
      const res = await fetch('/api/imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId, records: mappedData }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: (data) => {
      setImportSummary(data);
      queryClient.invalidateQueries({ queryKey: ['records', entityId] });
      setStep(3);
      toast.success('CSV Import completed!');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to submit records for import'),
  });

  const handleExecuteImport = () => {
    const hasMappings = Object.values(columnMap).some((val) => val !== '');
    if (!hasMappings) {
      toast.error('Please map at least one CSV column to a schema field.');
      return;
    }

    const mappedRecords = csvRows.map((row) => {
      const mappedRecord: Record<string, any> = {};
      fields.forEach((field) => {
        const csvCol = columnMap[field.name];
        if (csvCol && row[csvCol] !== undefined) {
          const rawVal = row[csvCol];
          if (field.type === 'checkbox') {
            mappedRecord[field.name] = String(rawVal).toLowerCase().trim() === 'true' || rawVal === true || rawVal === 1 || String(rawVal).trim() === 'yes';
          } else {
            mappedRecord[field.name] = rawVal;
          }
        }
      });
      return mappedRecord;
    });

    importMutation.mutate(mappedRecords);
  };

  const handleReset = () => {
    setCsvFile(null);
    setCsvHeaders([]);
    setCsvRows([]);
    setColumnMap({});
    setImportSummary(null);
    setShowPreflight(false);
    setStep(1);
  };

  const preflightResults = step === 2 && csvRows.length > 0 ? runPreflight() : [];
  const preflightIssues = preflightResults.filter((r) => r.issues.length > 0).length;
  const mappedFieldsCount = Object.values(columnMap).filter(Boolean).length;

  if (isAppLoading || isEntitiesLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
          <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Applications</Link>
          <span>/</span>
          <span>{application?.name}</span>
          <span>/</span>
          <Link href={`/app/${appId}/runtime/${entityId}`} className="hover:text-slate-300 transition-colors">{currentEntity?.name}</Link>
          <span>/</span>
          <span className="text-slate-300 font-medium">CSV Import</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <Link
            href={`/app/${appId}/runtime/${entityId}`}
            className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to records
          </Link>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Table className="h-5 w-5 text-blue-500" />
            <span>CSV Import — {currentEntity?.name}</span>
          </h1>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center justify-center gap-0">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  step > s.num
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : step === s.num
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}>
                  {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                </div>
                <span className={`mt-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                  step === s.num ? 'text-blue-400' : step > s.num ? 'text-emerald-400' : 'text-slate-600'
                }`}>{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 mb-5 transition-all ${step > s.num ? 'bg-emerald-500' : 'bg-slate-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <RuntimeErrorBoundary>
          {/* STEP 1: Upload File */}
          {step === 1 && (
            <div className="max-w-xl mx-auto py-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all glass-panel ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-950/20'
                    : 'border-slate-700 bg-slate-900/10 hover:border-slate-600'
                }`}
              >
                <CloudUpload className={`mx-auto h-12 w-12 mb-4 transition-colors ${isDragOver ? 'text-blue-400' : 'text-slate-500'}`} />
                <h3 className="text-base font-semibold text-slate-200">
                  {isDragOver ? 'Drop your CSV file here' : 'Upload or drag-drop a CSV file'}
                </h3>
                <p className="mt-2 text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  MetaForge parses CSV files client-side, letting you map custom columns to schema properties before importing.
                </p>
                <div className="mt-6 space-y-2">
                  <label className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer transition-all shadow-lg shadow-blue-500/20">
                    <Upload className="mr-2 h-4 w-4" />
                    Select CSV File
                    <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                  </label>
                  <p className="text-[10px] text-slate-600">or drag and drop — .csv files only</p>
                </div>
              </div>

              {/* Schema preview */}
              <div className="mt-4 p-4 rounded-xl border border-slate-800 bg-slate-900/20 glass-panel">
                <p className="text-xs font-semibold text-slate-400 mb-2">Expected fields for <span className="text-blue-400">{currentEntity?.name}</span>:</p>
                <div className="flex flex-wrap gap-1.5">
                  {fields.map((f) => (
                    <span key={f.name} className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                      f.required ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {f.name}{f.required ? ' *' : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Map & Preview */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Pre-flight summary bar */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-semibold ${
                preflightIssues > 0
                  ? 'border-amber-700/40 bg-amber-950/20 text-amber-400'
                  : 'border-emerald-700/40 bg-emerald-950/20 text-emerald-400'
              }`}>
                <div className="flex items-center space-x-2">
                  {preflightIssues > 0 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>
                    {csvRows.length} rows · {mappedFieldsCount}/{fields.length} fields mapped
                    {preflightIssues > 0 ? ` · ${preflightIssues} rows have validation warnings` : ' · Pre-flight looks good'}
                  </span>
                </div>
                {preflightIssues > 0 && (
                  <button onClick={() => setShowPreflight(!showPreflight)} className="underline cursor-pointer">
                    {showPreflight ? 'Hide' : 'View'} issues
                  </button>
                )}
              </div>

              {/* Pre-flight detail */}
              {showPreflight && preflightIssues > 0 && (
                <div className="p-4 rounded-xl border border-amber-800/30 bg-amber-950/10 space-y-2 max-h-48 overflow-y-auto">
                  {preflightResults.filter((r) => r.issues.length > 0).map((r) => (
                    <div key={r.rowIndex} className="flex items-start space-x-2 text-xs">
                      <span className="text-slate-500 font-mono shrink-0">Row {r.rowIndex}:</span>
                      <span className="text-amber-400">{r.issues.join(', ')}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column Mapping */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20 glass-panel space-y-4">
                    <div className="border-b border-slate-800 pb-3">
                      <h3 className="text-sm font-semibold text-slate-200">Map Columns</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Match CSV headers to schema fields.</p>
                    </div>

                    <div className="space-y-3">
                      {fields.map((field) => (
                        <div key={field.name} className="flex flex-col space-y-1.5">
                          <label className="text-xs font-semibold text-slate-400 flex justify-between">
                            <span>{field.name}</span>
                            {field.required && <span className="text-blue-400 font-normal">required</span>}
                          </label>
                          <div className="flex items-center space-x-2">
                            <select
                              value={columnMap[field.name] || ''}
                              onChange={(e) => handleMapChange(field.name, e.target.value)}
                              className={`w-full px-2.5 py-1.5 rounded-lg bg-slate-950 text-slate-200 border text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                                columnMap[field.name] ? 'border-emerald-800/40 text-emerald-300' : 'border-slate-800 text-slate-400'
                              }`}
                            >
                              <option value="">— Ignore field —</option>
                              {csvHeaders.map((header) => (
                                <option key={header} value={header}>{header}</option>
                              ))}
                            </select>
                            {columnMap[field.name]
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              : <XCircle className="h-3.5 w-3.5 text-slate-700 shrink-0" />
                            }
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex gap-2">
                      <button
                        onClick={handleReset}
                        className="flex-1 py-2 px-3 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-900 transition-all cursor-pointer"
                      >
                        Reset
                      </button>
                      <button
                        onClick={handleExecuteImport}
                        disabled={importMutation.isPending}
                        className="flex-grow inline-flex justify-center items-center py-2 px-3 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-all cursor-pointer shadow-md"
                      >
                        {importMutation.isPending && <Loader2 className="animate-spin mr-1.5 h-3.5 w-3.5" />}
                        Execute Import ({csvRows.length} rows)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Data Preview */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20 glass-panel">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-200">Data Preview</h3>
                        <p className="text-xs text-slate-500 mt-0.5">First 5 rows of &ldquo;{csvFile?.name}&rdquo;</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                          {csvRows.length} rows
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/30">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/50">
                            {csvHeaders.slice(0, 6).map((h) => (
                              <th key={h} className="px-4 py-2.5 font-semibold text-slate-400 uppercase truncate max-w-[120px]">{h}</th>
                            ))}
                            {csvHeaders.length > 6 && <th className="px-4 py-2.5 text-slate-600">…</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {csvRows.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/10">
                              {csvHeaders.slice(0, 6).map((h) => (
                                <td key={h} className="px-4 py-2.5 text-slate-400 truncate max-w-[120px]">
                                  {row[h] !== undefined ? String(row[h]) : <span className="text-slate-700">—</span>}
                                </td>
                              ))}
                              {csvHeaders.length > 6 && <td className="px-4 py-2.5 text-slate-700">…</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Import Summary */}
          {step === 3 && importSummary && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/20 glass-panel text-center space-y-5">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-200">Import Completed</h2>
                  <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                    Processed {importSummary.summary.totalProcessed} records from your CSV file.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/30 space-y-1">
                    <p className="text-2xl font-bold text-emerald-400">{importSummary.summary.importedCount}</p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Imported</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/30 space-y-1">
                    <p className="text-2xl font-bold text-amber-400">{importSummary.summary.duplicateCount}</p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Duplicates</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/30 space-y-1">
                    <p className="text-2xl font-bold text-red-400">{importSummary.summary.failedCount}</p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Failed</p>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center px-4 py-2.5 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Import Another
                  </button>
                  <Link
                    href={`/app/${appId}/runtime/${entityId}`}
                    className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer shadow-lg shadow-blue-500/20"
                  >
                    View Records
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {importSummary.failures?.length > 0 && (
                <div className="p-5 rounded-xl border border-red-900/30 bg-red-950/10 glass-panel space-y-3">
                  <h3 className="text-sm font-semibold text-red-400 flex items-center">
                    <AlertTriangle className="mr-1.5 h-4.5 w-4.5 shrink-0" />
                    Validation Failures ({importSummary.failures.length} rows)
                  </h3>
                  <div className="divide-y divide-slate-800 max-h-60 overflow-y-auto text-xs pr-2">
                    {importSummary.failures.map((fail: any) => (
                      <div key={fail.rowNumber} className="py-2.5 flex items-start space-x-4">
                        <span className="font-bold text-slate-500 font-mono shrink-0">Row {fail.rowNumber}</span>
                        <div className="flex-1 space-y-1">
                          <span className="font-semibold text-slate-400">{fail.data.name || fail.data.email || 'Record'}</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[10px] text-red-400/90 font-mono">
                            {Object.entries(fail.errors).map(([field, errors]: any) => (
                              <div key={field}>
                                <span className="font-bold text-slate-500">{field}:</span> {errors.join(', ')}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </RuntimeErrorBoundary>
      </div>
    </DashboardLayout>
  );
}
