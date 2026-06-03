'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import FormRenderer from '@/components/runtime/form-renderer';
import DetailRenderer from '@/components/runtime/detail-renderer';
import RuntimeErrorBoundary from '@/components/runtime/error-boundary';
import { ArrowLeft, Edit2, Loader2, Eye, EyeOff, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

function RecordDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const appId = params.appId as string;
  const entityId = params.entityId as string;
  const recordId = params.recordId as string;

  const [isEditMode, setIsEditMode] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | undefined>(undefined);

  // Read edit mode query param
  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setIsEditMode(true);
    }
  }, [searchParams]);

  // Fetch application details
  const { data: application, isLoading: isAppLoading } = useQuery<any>({
    queryKey: ['application', appId],
    queryFn: async () => {
      const res = await fetch('/api/applications');
      const data = await res.json();
      return data.data.find((a: any) => a.id === appId);
    }
  });

  // Fetch entities list to get schema fields
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
  const fields = schema?.fields || [];

  // Fetch record details
  const { data: record, isLoading: isRecordLoading, error } = useQuery<any>({
    queryKey: ['record', recordId],
    queryFn: async () => {
      const res = await fetch(`/api/records?entityId=${entityId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const matched = data.data.find((r: any) => r.id === recordId);
      if (!matched) throw new Error('Record not found');
      return matched;
    },
    enabled: !!recordId,
  });

  // Update record mutation
  const updateRecordMutation = useMutation({
    mutationFn: async (updatedData: Record<string, any>) => {
      setServerErrors(undefined);
      const res = await fetch('/api/records', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: recordId,
          entityId,
          data: updatedData,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.errors) {
          setServerErrors(data.errors);
        }
        throw new Error(data.message || 'Failed to update record');
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['record', recordId] });
      queryClient.invalidateQueries({ queryKey: ['records', entityId] });
      toast.success('Record updated successfully!');
      setIsEditMode(false);
      // Remove edit query param
      router.replace(`/app/${appId}/runtime/${entityId}/${recordId}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update record. Check fields.');
    },
  });

  const handleUpdate = (data: Record<string, any>) => {
    updateRecordMutation.mutate(data);
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      setIsEditMode(false);
      router.replace(`/app/${appId}/runtime/${entityId}/${recordId}`);
    } else {
      setIsEditMode(true);
      router.replace(`/app/${appId}/runtime/${entityId}/${recordId}?edit=true`);
    }
  };

  if (isAppLoading || isEntitiesLoading || isRecordLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 max-w-lg mx-auto flex items-center space-x-2">
          <AlertCircle className="h-6 w-6 shrink-0 animate-pulse" />
          <div>
            <h3 className="font-bold">Record Error</h3>
            <p className="text-sm">{(error as Error).message}</p>
            <Link href={`/app/${appId}/runtime/${entityId}`} className="text-xs text-red-300 underline mt-2 block">
              Back to Entity records
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
          <Link href="/dashboard" className="hover:text-slate-350">Applications</Link>
          <span>/</span>
          <span>{application?.name}</span>
          <span>/</span>
          <Link href={`/app/${appId}/runtime/${entityId}`} className="hover:text-slate-350">{currentEntity?.name}</Link>
          <span>/</span>
          <span className="text-slate-400 font-semibold">{isEditMode ? 'Edit' : 'View'} Record</span>
        </div>

        {/* Action Header controls */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-5">
          <Link
            href={`/app/${appId}/runtime/${entityId}`}
            className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to records
          </Link>

          <button
            onClick={toggleEditMode}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isEditMode
                ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                : 'bg-blue-650/10 border-blue-500/20 text-blue-400 hover:bg-blue-600/20'
            }`}
          >
            {isEditMode ? (
              <>
                <Eye className="mr-1.5 h-4 w-4" />
                View Details
              </>
            ) : (
              <>
                <Edit2 className="mr-1.5 h-4 w-4" />
                Edit Record
              </>
            )}
          </button>
        </div>

        {/* View or Edit Card rendering */}
        <div className="max-w-2xl mx-auto bg-slate-900/40 border border-slate-900 p-6 rounded-2xl shadow-xl glass-panel space-y-6">
          
          {/* Metadata Sub-header */}
          <div className="flex items-center justify-between border-b border-slate-850 pb-4 text-xs text-slate-500">
            <span className="font-mono">ID: {record.id}</span>
            <span className="flex items-center">
              <Calendar className="mr-1 h-3.5 w-3.5" />
              Updated: {new Date(record.updatedAt || record.createdAt).toLocaleString()}
            </span>
          </div>

          <RuntimeErrorBoundary>
            {isEditMode ? (
              <FormRenderer
                fields={fields}
                defaultValues={record.data}
                onSubmit={handleUpdate}
                isLoading={updateRecordMutation.isPending}
                submitLabel="Save Changes"
                serverErrors={serverErrors}
              />
            ) : (
              <DetailRenderer fields={fields} recordData={record.data} />
            )}
          </RuntimeErrorBoundary>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function RecordDetailPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-550" />
        </div>
      </DashboardLayout>
    }>
      <RecordDetail />
    </Suspense>
  );
}
