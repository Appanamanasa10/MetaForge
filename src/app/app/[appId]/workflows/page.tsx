'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import RuntimeErrorBoundary from '@/components/runtime/error-boundary';
import {
  Workflow,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  HelpCircle,
  Link as LinkIcon,
  Bell,
  FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function WorkflowBuilderPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const appId = params.appId as string;

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [triggerType, setTriggerType] = useState('RECORD_CREATED');
  const [actionType, setActionType] = useState('NOTIFICATION');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [titleTemplate, setTitleTemplate] = useState('');

  // Fetch application details
  const { data: application, isLoading: isAppLoading } = useQuery<any>({
    queryKey: ['application', appId],
    queryFn: async () => {
      const res = await fetch('/api/applications');
      const data = await res.json();
      return data.data.find((a: any) => a.id === appId);
    }
  });

  // Fetch workflows list
  const { data: workflows = [], isLoading: isWorkflowsLoading } = useQuery<any[]>({
    queryKey: ['workflows', appId],
    queryFn: async () => {
      const res = await fetch(`/api/workflows?applicationId=${appId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    }
  });

  // Load selected workflow details
  const handleSelectWorkflow = (wf: any) => {
    setSelectedWorkflowId(wf.id);
    setTriggerType(wf.triggerType);
    setActionType(wf.actionType);
    const config = wf.configurationJson || {};
    setMessageTemplate(config.messageTemplate || '');
    setTitleTemplate(config.titleTemplate || '');
  };

  const handleCreateNewWorkflow = () => {
    setSelectedWorkflowId(null);
    setTriggerType('RECORD_CREATED');
    setActionType('NOTIFICATION');
    setMessageTemplate('A new record has been created with values: {{name}}');
    setTitleTemplate('New Record Logged');
  };

  // Save workflow mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (savedWf) => {
      queryClient.invalidateQueries({ queryKey: ['workflows', appId] });
      toast.success('Workflow automation configuration saved!');
      setSelectedWorkflowId(savedWf.id);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save workflow');
    }
  });

  const handleSave = () => {
    if (!messageTemplate.trim()) {
      toast.error('Message template is required.');
      return;
    }

    saveMutation.mutate({
      id: selectedWorkflowId || undefined,
      applicationId: appId,
      triggerType,
      actionType,
      configurationJson: {
        messageTemplate: messageTemplate.trim(),
        titleTemplate: titleTemplate.trim() || 'Workflow Event Triggered',
      }
    });
  };

  // Delete workflow mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/workflows?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows', appId] });
      toast.success('Workflow deleted');
      handleCreateNewWorkflow();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete workflow');
    }
  });

  const handleDelete = () => {
    if (!selectedWorkflowId) return;
    if (confirm('Are you sure you want to delete this workflow automation?')) {
      deleteMutation.mutate(selectedWorkflowId);
    }
  };

  if (isAppLoading || isWorkflowsLoading) {
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
          <span className="text-slate-400 font-semibold">Workflow Automation Builder</span>
        </div>

        {/* Action Header controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
              <Workflow className="h-6 w-6 text-blue-500 animate-spin-slow" />
              <span>Workflow Automation Builder</span>
            </h1>
            <p className="text-xs text-slate-500">Design event-driven triggers for application processes.</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/app/${appId}/builder`}
              className="inline-flex items-center px-3.5 py-2 border border-slate-800 bg-slate-900/40 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Schema Designer
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left panel: list workflows */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/20 glass-panel">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Automations</h3>
                <button
                  onClick={handleCreateNewWorkflow}
                  className="p-1 rounded bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/10 cursor-pointer"
                  title="Add Workflow"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {workflows.length === 0 && selectedWorkflowId === null && !messageTemplate ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No workflows configured yet. Click &ldquo;+&rdquo; to start.
                </div>
              ) : (
                <div className="space-y-1">
                  {workflows.map((wf) => {
                    const isSelected = selectedWorkflowId === wf.id;
                    const triggerText = wf.triggerType.replace('RECORD_', '').toLowerCase();
                    const actionIcon = wf.actionType === 'NOTIFICATION' ? Bell : FileSpreadsheet;

                    return (
                      <button
                        key={wf.id}
                        onClick={() => handleSelectWorkflow(wf)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600/10 border-l-2 border-blue-500 text-blue-400 pl-2.5'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="font-semibold capitalize text-slate-250">{triggerText} trigger</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{wf.configurationJson?.titleTemplate}</p>
                        </div>
                        <span className="shrink-0 p-1 bg-slate-950 rounded text-slate-500">
                          {React.createElement(actionIcon, { className: 'h-3.5 w-3.5' })}
                        </span>
                      </button>
                    );
                  })}
                  {!selectedWorkflowId && messageTemplate && (
                    <button
                      className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium bg-blue-600/10 border-l-2 border-blue-500 text-blue-400 pl-2.5"
                      disabled
                    >
                      <span className="italic">New Automation [Draft]</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right panel workflow editor */}
          <div className="lg:col-span-3">
            <RuntimeErrorBoundary>
              {(selectedWorkflowId !== null || messageTemplate) && (
                <div className="p-6 rounded-xl border border-slate-900 bg-slate-900/20 glass-panel space-y-6">
                  
                  {/* Editor Header */}
                  <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">
                        {selectedWorkflowId ? 'Edit Workflow Automation' : 'Configure New Automation'}
                      </h3>
                      <p className="text-xs text-slate-500">Event triggers execute dynamic code blocks asynchronously.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saveMutation.isPending}
                        className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white transition-all cursor-pointer"
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="animate-spin mr-1.5 h-3.5 w-3.5" />
                        ) : (
                          <Save className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Save Workflow
                      </button>
                      {selectedWorkflowId && (
                        <button
                          onClick={handleDelete}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-850 rounded transition-colors cursor-pointer"
                          title="Delete Workflow"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Select Trigger */}
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        When this Event occurs (Trigger)
                      </label>
                      <select
                        value={triggerType}
                        onChange={(e) => setTriggerType(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="RECORD_CREATED">Record Created</option>
                        <option value="RECORD_UPDATED">Record Updated</option>
                        <option value="RECORD_DELETED">Record Deleted</option>
                      </select>
                    </div>

                    {/* Select Action */}
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Execute this Action
                      </label>
                      <select
                        value={actionType}
                        onChange={(e) => setActionType(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="NOTIFICATION">Create Notification</option>
                        <option value="AUDIT_LOG">Create Audit Log</option>
                      </select>
                    </div>

                    {/* Title Template */}
                    <div className="flex flex-col space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Title / Event Name Template
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Student {{name}} Created"
                        value={titleTemplate}
                        onChange={(e) => setTitleTemplate(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Message Template */}
                    <div className="flex flex-col space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Message Template
                      </label>
                      <textarea
                        rows={4}
                        placeholder="e.g. Student {{name}} was successfully registered with CGPA {{cgpa}}."
                        value={messageTemplate}
                        onChange={(e) => setMessageTemplate(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Information Guide Card */}
                  <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 text-xs text-slate-450 space-y-2 leading-relaxed">
                    <h4 className="font-semibold text-slate-350 flex items-center">
                      <HelpCircle className="mr-1.5 h-4 w-4 text-blue-450" />
                      Dynamic Interpolation Syntax
                    </h4>
                    <p>
                      You can interpolate field variables directly into the Title and Message templates using double curly brackets:{' '}
                      <code className="text-blue-400 font-mono">&#123;&#123;fieldName&#125;&#125;</code>.
                    </p>
                    <p>
                      For example: if your entity schema contains field <code className="text-slate-400 font-mono">name</code> and{' '}
                      <code className="text-slate-400 font-mono">cgpa</code>, you can use templates like:{' '}
                      <code className="text-slate-450">&ldquo;Student &#123;&#123;name&#125;&#125; has CGPA of &#123;&#123;cgpa&#125;&#125;&rdquo;</code>.
                      If fields are missing during execution, they will resolve safely to bracket tokens without crashing.
                    </p>
                  </div>

                </div>
              )}
            </RuntimeErrorBoundary>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
