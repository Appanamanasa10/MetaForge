'use client';

import React, { useState } from 'react';
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
  Database,
  RefreshCw,
  Info,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Papa from 'papaparse';

export default function CSVImportPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const appId = params.appId as string;
  const entityId = params.entityId as string;

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({}); // { schemaFieldName: csvHeaderName }
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Map & Preview, 3: Success Report
  const [importSummary, setImportSummary] = useState<any | null>(null);

  // Fetch application details
  const { data: application, isLoading: isAppLoading } = useQuery<any>({
    queryKey: ['application', appId],
    queryFn: async () => {
      const res = await fetch('/api/applications');
      const data = await res.json();
      return data.data.find((a: any) => a.id === appId);
    }
  });

  // Fetch entities to get active schema
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

  // Parse CSV File client-side
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        setCsvRows(results.data);

        // Auto-match headers to schema fields by name (case-insensitive)
        const initialMap: Record<string, string> = {};
        fields.forEach((field) => {
          const matchedHeader = headers.find(
            (h) => h.toLowerCase().trim() === field.name.toLowerCase().trim()
          );
          if (matchedHeader) {
            initialMap[field.name] = matchedHeader;
          } else {
            initialMap[field.name] = ''; // Leave unmapped
          }
        });

        setColumnMap(initialMap);
        setStep(2);
        toast.success(`Successfully parsed ${results.data.length} rows!`);
      },
      error: () => {
        toast.error('Failed to parse CSV file. Ensure it is a valid format.');
      }
    });
  };

  const handleMapChange = (fieldName: string, headerName: string) => {
    setColumnMap((prev) => ({
      ...prev,
      [fieldName]: headerName,
    }));
  };

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (mappedData: any[]) => {
      const res = await fetch('/api/imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId,
          records: mappedData,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: (data) => {
      setImportSummary(data);
      queryClient.invalidateQueries({ queryKey: ['records', entityId] });
      setStep(3);
      toast.success('CSV Import processing completed.');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to submit records for import');
    }
  });

  const handleExecuteImport = () => {
    // Check if at least one column is mapped
    const hasMappings = Object.values(columnMap).some((val) => val !== '');
    if (!hasMappings) {
      toast.error('Please map at least one CSV column to a schema field.');
      return;
    }

    // Map rows according to the column configuration map
    const mappedRecords = csvRows.map((row) => {
      const mappedRecord: Record<string, any> = {};
      fields.forEach((field) => {
        const csvCol = columnMap[field.name];
        if (csvCol && row[csvCol] !== undefined) {
          const rawVal = row[csvCol];
          // Handle checkbox coercing client-side for smoother preview
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
    setStep(1);
  };

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
          <Link href="/dashboard" className="hover:text-slate-350">Applications</Link>
          <span>/</span>
          <span>{application?.name}</span>
          <span>/</span>
          <Link href={`/app/${appId}/runtime/${entityId}`} className="hover:text-slate-350">{currentEntity?.name}</Link>
          <span>/</span>
          <span className="text-slate-400 font-semibold">CSV Import</span>
        </div>

        {/* Back Link */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-5">
          <Link
            href={`/app/${appId}/runtime/${entityId}`}
            className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to records
          </Link>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Table className="h-5 w-5 text-blue-500" />
            <span>CSV Import Manager</span>
          </h1>
        </div>

        <RuntimeErrorBoundary>
          {/* STEP 1: Upload File */}
          {step === 1 && (
            <div className="max-w-xl mx-auto py-8">
              <div className="border-2 border-dashed border-slate-800 bg-slate-900/10 rounded-2xl p-10 text-center glass-panel">
                <Upload className="mx-auto h-12 w-12 text-blue-500 animate-bounce" />
                <h3 className="mt-4 text-base font-semibold text-slate-200">Upload CSV file</h3>
                <p className="mt-2 text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  MetaForge parses CSV files client-side, letting you map custom columns to schema properties before importing.
                </p>
                <div className="mt-6">
                  <label className="inline-flex items-center px-4 py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer transition-all shadow-lg shadow-blue-500/20">
                    <span>Select CSV File</span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Map & Preview */}
          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Columns Mapping side */}
              <div className="lg:col-span-1 space-y-4">
                <div className="p-5 rounded-xl border border-slate-900 bg-slate-900/20 glass-panel space-y-4">
                  <div className="border-b border-slate-850 pb-3">
                    <h3 className="text-sm font-semibold text-slate-200">Map Columns</h3>
                    <p className="text-xs text-slate-500">Associate CSV column headers with your entity schema fields.</p>
                  </div>

                  <div className="space-y-4">
                    {fields.map((field) => (
                      <div key={field.name} className="flex flex-col space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                          <span>{field.name}</span>
                          {field.required && <span className="text-blue-550">Required</span>}
                        </label>
                        <select
                          value={columnMap[field.name] || ''}
                          onChange={(e) => handleMapChange(field.name, e.target.value)}
                          className="w-full px-3 py-1.5 rounded bg-slate-950 text-slate-200 border border-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="">-- Ignore Field --</option>
                          {csvHeaders.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-855 flex gap-2">
                    <button
                      onClick={handleReset}
                      className="flex-1 py-2 px-3 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-900 transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleExecuteImport}
                      disabled={importMutation.isPending}
                      className="flex-grow inline-flex justify-center items-center py-2 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-all cursor-pointer shadow-md"
                    >
                      {importMutation.isPending && <Loader2 className="animate-spin mr-1.5 h-3.5 w-3.5" />}
                      Execute Import
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Preview side */}
              <div className="lg:col-span-2 space-y-4">
                <div className="p-5 rounded-xl border border-slate-900 bg-slate-900/20 glass-panel">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">Raw Data Preview</h3>
                      <p className="text-xs text-slate-500">Previewing first 5 rows of &ldquo;{csvFile?.name}&rdquo;</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      Total parsed: {csvRows.length} rows
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded border border-slate-850 bg-slate-950/30">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-850 bg-slate-900/50">
                          {csvHeaders.slice(0, 6).map((h) => (
                            <th key={h} className="px-4 py-2 font-semibold text-slate-450 uppercase truncate max-w-[120px]">
                              {h}
                            </th>
                          ))}
                          {csvHeaders.length > 6 && <th className="px-4 py-2 text-slate-550">...</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {csvRows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/10">
                            {csvHeaders.slice(0, 6).map((h) => (
                              <td key={h} className="px-4 py-2.5 text-slate-350 truncate max-w-[120px]">
                                {row[h] !== undefined ? String(row[h]) : '-'}
                              </td>
                            ))}
                            {csvHeaders.length > 6 && <td className="px-4 py-2.5 text-slate-600">...</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Success Report */}
          {step === 3 && importSummary && (
            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* Core summary card */}
              <div className="p-6 rounded-xl border border-slate-900 bg-slate-900/20 glass-panel text-center space-y-4">
                <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
                <h2 className="text-xl font-bold text-slate-200">CSV Import Completed</h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Import operation processed {importSummary.summary.totalProcessed} records. Details are described below.
                </p>

                {/* Stat Grid */}
                <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto pt-4">
                  <div className="p-3.5 rounded-lg border border-slate-850 bg-slate-950/20">
                    <p className="text-xl font-bold text-emerald-450">{importSummary.summary.importedCount}</p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Imported</p>
                  </div>
                  <div className="p-3.5 rounded-lg border border-slate-850 bg-slate-950/20">
                    <p className="text-xl font-bold text-amber-500">{importSummary.summary.duplicateCount}</p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Duplicates</p>
                  </div>
                  <div className="p-3.5 rounded-lg border border-slate-850 bg-slate-950/20">
                    <p className="text-xl font-bold text-red-500">{importSummary.summary.failedCount}</p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Failed</p>
                  </div>
                </div>

                <div className="pt-6 flex justify-center gap-3">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center px-4 py-2 border border-slate-800 rounded-lg text-xs font-semibold text-slate-450 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Import Another File
                  </button>
                  <Link
                    href={`/app/${appId}/runtime/${entityId}`}
                    className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer"
                  >
                    View Record Database
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Validation errors detail lists */}
              {importSummary.failures.length > 0 && (
                <div className="p-5 rounded-xl border border-slate-900 bg-slate-900/20 glass-panel space-y-3">
                  <h3 className="text-sm font-semibold text-red-400 flex items-center">
                    <AlertTriangle className="mr-1.5 h-4.5 w-4.5 shrink-0" />
                    Validation Failures Detail Report
                  </h3>
                  <div className="divide-y divide-slate-850 max-h-60 overflow-y-auto text-xs pr-2">
                    {importSummary.failures.map((fail: any) => (
                      <div key={fail.rowNumber} className="py-2.5 flex items-start space-x-4">
                        <span className="font-bold text-slate-500 font-mono shrink-0">Row {fail.rowNumber}</span>
                        <div className="flex-1 space-y-1">
                          <span className="font-semibold text-slate-350">{fail.data.name || fail.data.email || 'Record'}</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[10px] text-red-400/90 font-mono">
                            {Object.entries(fail.errors).map(([field, errors]: any) => (
                              <div key={field}>
                                <span className="font-bold text-slate-400">{field}:</span> {errors.join(', ')}
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
