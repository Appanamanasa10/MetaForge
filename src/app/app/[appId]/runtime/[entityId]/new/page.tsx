'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import FormRenderer from '@/components/runtime/form-renderer';
import RuntimeErrorBoundary from '@/components/runtime/error-boundary';
import { ArrowLeft, Loader2, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function NewRecordPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.appId as string;
  const entityId = params.entityId as string;

  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | undefined>(undefined);

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

  // Create record mutation
  const createRecordMutation = useMutation({
    mutationFn: async (recordData: Record<string, any>) => {
      setServerErrors(undefined);
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId,
          data: recordData,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.errors) {
          setServerErrors(data.errors);
        }
        throw new Error(data.message || 'Failed to create record');
      }
      return data.data;
    },
    onSuccess: () => {
      toast.success('Record created successfully!');
      router.push(`/app/${appId}/runtime/${entityId}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Validation failed. Check form fields.');
    },
  });

  const handleSubmit = (data: Record<string, any>) => {
    createRecordMutation.mutate(data);
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
        <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
          <Link href="/dashboard" className="hover:text-slate-350">Applications</Link>
          <span>/</span>
          <span>{application?.name}</span>
          <span>/</span>
          <Link href={`/app/${appId}/runtime/${entityId}`} className="hover:text-slate-350">{currentEntity?.name}</Link>
          <span>/</span>
          <span className="text-slate-400 font-semibold">New Record</span>
        </div>

        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href={`/app/${appId}/runtime/${entityId}`}
            className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to records
          </Link>
        </div>

        {/* Form Container Card */}
        <div className="max-w-xl mx-auto bg-slate-900/40 border border-slate-900 p-6 rounded-2xl shadow-xl glass-panel">
          <div className="flex items-center space-x-2 border-b border-slate-850 pb-4 mb-6">
            <Database className="h-5.5 w-5.5 text-blue-500" />
            <div>
              <h2 className="text-lg font-bold text-slate-200">Add {currentEntity?.name || 'Record'}</h2>
              <p className="text-xs text-slate-550">Dynamic form generated from database config schema.</p>
            </div>
          </div>

          <RuntimeErrorBoundary>
            <FormRenderer
              fields={fields}
              onSubmit={handleSubmit}
              isLoading={createRecordMutation.isPending}
              submitLabel={`Create ${currentEntity?.name || 'Record'}`}
              serverErrors={serverErrors}
            />
          </RuntimeErrorBoundary>
        </div>
      </div>
    </DashboardLayout>
  );
}
