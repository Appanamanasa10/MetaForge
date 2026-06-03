'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import TableRenderer from '@/components/runtime/table-renderer';
import RuntimeErrorBoundary from '@/components/runtime/error-boundary';
import { FieldDefinition } from '@/types';
import { Plus, ArrowLeft, Upload, Loader2, AlertCircle, Database, Layout } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function RuntimeEntityPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const appId = params.appId as string;
  const entityId = params.entityId as string;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Debounce search input to avoid hitting backend API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch application details
  const { data: application, isLoading: isAppLoading } = useQuery<any>({
    queryKey: ['application', appId],
    queryFn: async () => {
      const res = await fetch('/api/applications');
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data.find((a: any) => a.id === appId);
    }
  });

  // Fetch entities list (for sidebar switching)
  const { data: entities = [], isLoading: isEntitiesLoading } = useQuery<any[]>({
    queryKey: ['entities', appId],
    queryFn: async () => {
      const res = await fetch('/api/applications');
      const data = await res.json();
      const app = data.data.find((a: any) => a.id === appId);
      return app ? app.entities : [];
    }
  });

  // Find currently active entity
  const currentEntity = entities.find((e) => e.id === entityId);
  const schema = currentEntity?.schemaJson;
  const fields: FieldDefinition[] = schema?.fields || [];

  // Fetch records with search & pagination
  const { data: recordsData, isLoading: isRecordsLoading, error } = useQuery<any>({
    queryKey: ['records', entityId, debouncedSearch, page],
    queryFn: async () => {
      const url = `/api/records?entityId=${entityId}&page=${page}&limit=${limit}&search=${encodeURIComponent(
        debouncedSearch
      )}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    enabled: !!entityId,
  });

  // Delete mutation
  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const res = await fetch(`/api/records?id=${recordId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', entityId] });
      toast.success('Record deleted successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete record');
    },
  });

  const handleDelete = (recordId: string) => {
    if (confirm('Are you sure you want to delete this record? This action is irreversible.')) {
      deleteRecordMutation.mutate(recordId);
    }
  };

  const handleEdit = (recordId: string) => {
    router.push(`/app/${appId}/runtime/${entityId}/${recordId}?edit=true`);
  };

  const handleView = (recordId: string) => {
    router.push(`/app/${appId}/runtime/${entityId}/${recordId}`);
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
        
        {/* Navigation Breadcrumbs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Link href="/dashboard" className="hover:text-slate-300">Applications</Link>
              <span>/</span>
              <span className="text-slate-400">{application?.name}</span>
              <span>/</span>
              <span className="text-slate-400 font-semibold">{currentEntity?.name} Runtime</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
              <Database className="h-6 w-6 text-blue-500" />
              <span>{currentEntity?.name} Management</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/app/${appId}/import/${entityId}`}
              className="inline-flex items-center px-3.5 py-2 border border-slate-800 bg-slate-900/40 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Upload className="mr-1.5 h-4 w-4 text-blue-400" />
              Import CSV
            </Link>
            <Link
              href={`/app/${appId}/runtime/${entityId}/new`}
              className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add {currentEntity?.name || 'Record'}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left panel sidebar: entity tabs */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/20 glass-panel">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                <Layout className="mr-2 h-4.5 w-4.5 text-blue-500" />
                Select Runtime Entity
              </h3>
              <div className="space-y-1">
                {entities.map((ent) => {
                  const isActive = ent.id === entityId;
                  return (
                    <Link
                      key={ent.id}
                      href={`/app/${appId}/runtime/${ent.id}`}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600/10 border-l-2 border-blue-500 text-blue-400 pl-2.5'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{ent.name}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-900">
                <Link
                  href={`/app/${appId}/builder`}
                  className="w-full inline-flex justify-center items-center py-2 px-3 border border-dashed border-slate-800 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:border-slate-700 transition-colors"
                >
                  Edit Schema definitions
                </Link>
              </div>
            </div>
          </div>

          {/* Right panel list area */}
          <div className="lg:col-span-3">
            <RuntimeErrorBoundary>
              {error ? (
                <div className="p-4 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{(error as Error).message}</span>
                </div>
              ) : (
                <TableRenderer
                  fields={fields}
                  records={recordsData?.data || []}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isLoading={isRecordsLoading}
                  search={search}
                  onSearchChange={setSearch}
                  page={page}
                  totalPages={recordsData?.pagination?.totalPages || 1}
                  onPageChange={setPage}
                />
              )}
            </RuntimeErrorBoundary>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
