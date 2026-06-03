'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import FormRenderer from '@/components/runtime/form-renderer';
import TableRenderer from '@/components/runtime/table-renderer';
import { EntitySchema, FieldDefinition } from '@/types';
import {
  Code,
  Eye,
  Save,
  Trash2,
  Plus,
  Loader2,
  FileJson,
  Play,
  Settings,
  AlertTriangle,
  Sparkles,
  Link as LinkIcon,
  Workflow
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const DEFAULT_SCHEMA: EntitySchema = {
  entity: 'Student',
  fields: [
    { name: 'name', type: 'text', required: true, placeholder: 'Enter student name' },
    { name: 'email', type: 'email', required: true, placeholder: 'name@university.edu' },
    { name: 'cgpa', type: 'number', placeholder: 'Enter CGPA (e.g. 3.8)' },
    { name: 'status', type: 'select', options: ['Active', 'Suspended', 'Graduated'], defaultValue: 'Active' },
    { name: 'enrollmentDate', type: 'date' },
    { name: 'isScholar', type: 'checkbox', placeholder: 'Receives scholarship' }
  ]
};

export default function ApplicationBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const appId = params.appId as string;

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [parsedSchema, setParsedSchema] = useState<EntitySchema | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [previewMode, setPreviewMode] = useState<'form' | 'table'>('form');

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

  // Fetch entities list for this application
  const { data: entities = [], isLoading: isEntitiesLoading } = useQuery<any[]>({
    queryKey: ['entities', appId],
    queryFn: async () => {
      const res = await fetch(`/api/applications`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const app = data.data.find((a: any) => a.id === appId);
      return app ? app.entities : [];
    }
  });

  // Automatically select the first entity if available
  useEffect(() => {
    if (entities.length > 0 && !selectedEntityId) {
      setSelectedEntityId(entities[0].id);
    }
  }, [entities, selectedEntityId]);

  // Load selected entity schema into state
  useEffect(() => {
    if (selectedEntityId && entities.length > 0) {
      const selected = entities.find((e) => e.id === selectedEntityId);
      if (selected) {
        const schemaString = JSON.stringify(selected.schemaJson, null, 2);
        setJsonInput(schemaString);
        try {
          const parsed = JSON.parse(schemaString);
          setParsedSchema(parsed);
          setValidationError(null);
        } catch (e) {
          // Ignore
        }
      }
    }
  }, [selectedEntityId, entities]);

  // Live validate JSON input in real-time
  const handleJsonChange = (val: string) => {
    setJsonInput(val);
    if (!val.trim()) {
      setValidationError('Schema cannot be empty');
      setParsedSchema(null);
      return;
    }

    try {
      const parsed = JSON.parse(val);
      
      // Basic structural validation
      if (!parsed.entity || typeof parsed.entity !== 'string') {
        setValidationError('Invalid Schema: Root must contain a string "entity" name.');
        setParsedSchema(null);
        return;
      }
      if (!Array.isArray(parsed.fields)) {
        setValidationError('Invalid Schema: Root must contain a "fields" array.');
        setParsedSchema(null);
        return;
      }

      // Validate fields structure
      for (const field of parsed.fields) {
        if (!field.name || typeof field.name !== 'string') {
          setValidationError('Invalid Field: Each field must contain a string "name".');
          setParsedSchema(null);
          return;
        }
        if (!field.type || typeof field.type !== 'string') {
          setValidationError(`Invalid Field [${field.name}]: Must specify a "type".`);
          setParsedSchema(null);
          return;
        }
      }

      setValidationError(null);
      setParsedSchema(parsed);
    } catch (e: any) {
      setValidationError(`Syntax Error: ${e.message}`);
      setParsedSchema(null);
    }
  };

  // Save Entity mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: { id?: string; applicationId: string; name: string; schemaJson: any }) => {
      const res = await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (savedEntity) => {
      queryClient.invalidateQueries({ queryKey: ['entities', appId] });
      queryClient.invalidateQueries({ queryKey: ['application', appId] });
      toast.success(`Entity "${savedEntity.name}" saved successfully!`);
      setSelectedEntityId(savedEntity.id);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save entity');
    }
  });

  const handleSaveSchema = () => {
    if (validationError || !parsedSchema) {
      toast.error('Cannot save invalid JSON schema.');
      return;
    }

    saveMutation.mutate({
      id: selectedEntityId || undefined,
      applicationId: appId,
      name: parsedSchema.entity,
      schemaJson: parsedSchema,
    });
  };

  // Delete Entity mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/entities?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', appId] });
      queryClient.invalidateQueries({ queryKey: ['application', appId] });
      toast.success('Entity schema deleted');
      setSelectedEntityId(null);
      setJsonInput('');
      setParsedSchema(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete entity');
    }
  });

  const handleDeleteEntity = () => {
    if (!selectedEntityId) return;
    if (confirm('Are you sure you want to delete this entity? This deletes all associated data records.')) {
      deleteMutation.mutate(selectedEntityId);
    }
  };

  const handleCreateNewEntity = () => {
    setSelectedEntityId(null);
    const defaultSchemaStr = JSON.stringify(DEFAULT_SCHEMA, null, 2);
    setJsonInput(defaultSchemaStr);
    setParsedSchema(DEFAULT_SCHEMA);
    setValidationError(null);
    setActiveTab('editor');
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch (e) {
      toast.error('Cannot format invalid JSON');
    }
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1.5">
              <Link href="/dashboard" className="hover:text-slate-300">Applications</Link>
              <span>/</span>
              <span className="text-slate-400">{application?.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center">
              <span>Application Schema Builder</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/app/${appId}/workflows`}
              className="inline-flex items-center px-3.5 py-2 border border-slate-800 bg-slate-900/40 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Workflow className="mr-1.5 h-4 w-4 text-blue-400" />
              Workflows
            </Link>
            {selectedEntityId && (
              <Link
                href={`/app/${appId}/runtime/${selectedEntityId}`}
                className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 transition-colors"
              >
                <Play className="mr-1.5 h-4 w-4" />
                Launch Runtime
              </Link>
            )}
          </div>
        </div>

        {/* Builder Work Area split */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left panel: entity listing */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/20 glass-panel">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entities</h3>
                <button
                  onClick={handleCreateNewEntity}
                  className="p-1 rounded bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/10 cursor-pointer"
                  title="Add Entity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {entities.length === 0 && !parsedSchema ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No entities defined yet. Click &ldquo;+&rdquo; to start.
                </div>
              ) : (
                <div className="space-y-1">
                  {entities.map((ent) => {
                    const isSelected = selectedEntityId === ent.id;
                    return (
                      <button
                        key={ent.id}
                        onClick={() => setSelectedEntityId(ent.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600/10 border-l-2 border-blue-500 text-blue-400 pl-2.5'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                      >
                        <span className="truncate">{ent.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {ent.schemaJson?.fields?.length || 0} fields
                        </span>
                      </button>
                    );
                  })}
                  {!selectedEntityId && parsedSchema && (
                    <button
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium bg-blue-600/10 border-l-2 border-blue-500 text-blue-400 pl-2.5"
                      disabled
                    >
                      <span className="italic truncate">{parsedSchema.entity} [New]</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Editor & Live Preview */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Header controls & Tabs */}
            <div className="flex items-center justify-between bg-slate-900/40 p-2 rounded-xl border border-slate-900/60 glass-panel">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'editor'
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code className="mr-1.5 h-4 w-4" />
                  JSON Schema Editor
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="mr-1.5 h-4 w-4" />
                  Live Preview
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeTab === 'editor' && (
                  <button
                    onClick={formatJson}
                    className="px-2.5 py-1.5 rounded border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-200 text-xs font-medium cursor-pointer"
                  >
                    Format JSON
                  </button>
                )}
                <button
                  onClick={handleSaveSchema}
                  disabled={saveMutation.isPending || !!validationError || !parsedSchema}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="animate-spin mr-1.5 h-3.5 w-3.5" />
                  ) : (
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Save Schema
                </button>
                {selectedEntityId && (
                  <button
                    onClick={handleDeleteEntity}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    title="Delete Entity"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Content area: Editor Tab */}
            {activeTab === 'editor' && (
              <div className="space-y-4">
                
                {/* Error Banner */}
                {validationError && (
                  <div className="p-3.5 rounded-lg border border-red-500/20 bg-red-950/10 text-red-400 text-xs font-medium flex items-start space-x-2 animate-pulse">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="font-mono">{validationError}</span>
                  </div>
                )}

                {/* Textarea Code block editor */}
                <div className="relative rounded-xl border border-slate-900 bg-slate-950/80 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2 border-b border-slate-900 pb-2">
                    <span className="flex items-center">
                      <FileJson className="mr-1.5 h-4 w-4 text-blue-500" />
                      schema.json
                    </span>
                    <span>JSON Schema definition</span>
                  </div>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    rows={18}
                    placeholder="Paste entity schema configuration JSON here..."
                    className="w-full bg-transparent text-slate-200 font-mono text-sm leading-relaxed focus:outline-none resize-y min-h-[300px]"
                    style={{ tabSize: 2 }}
                  />
                </div>

                {/* Helper templates box */}
                <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 text-xs text-slate-400 space-y-2 leading-relaxed">
                  <h4 className="font-semibold text-slate-350 flex items-center">
                    <Sparkles className="mr-1 h-3.5 w-3.5 text-blue-450" />
                    Configuration Syntax Helper
                  </h4>
                  <p>
                    MetaForge interprets this schema map to generate forms and database rules.
                    Supported types are: <code className="text-blue-400 font-mono">text</code>,{' '}
                    <code className="text-blue-400 font-mono">textarea</code>,{' '}
                    <code className="text-blue-400 font-mono">email</code>,{' '}
                    <code className="text-blue-400 font-mono">number</code>,{' '}
                    <code className="text-blue-400 font-mono">select</code> (requires{' '}
                    <code className="text-blue-400 font-mono">options: [&ldquo;A&rdquo;, &ldquo;B&rdquo;]</code>),{' '}
                    <code className="text-blue-400 font-mono">checkbox</code>, and{' '}
                    <code className="text-blue-400 font-mono">date</code>.
                  </p>
                </div>
              </div>
            )}

            {/* Content area: Preview Tab */}
            {activeTab === 'preview' && (
              <div className="p-6 rounded-xl border border-slate-900 bg-slate-900/10 glass-panel space-y-6">
                
                {/* Form or Table Mode Select */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">
                      Live Component Render: {parsedSchema?.entity || 'App'}
                    </h3>
                    <p className="text-xs text-slate-500">Preview components as they will look in the runtime.</p>
                  </div>

                  <div className="flex space-x-1 bg-slate-900/60 p-1 rounded-lg border border-slate-850">
                    <button
                      onClick={() => setPreviewMode('form')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                        previewMode === 'form' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Forms
                    </button>
                    <button
                      onClick={() => setPreviewMode('table')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                        previewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Tables
                    </button>
                  </div>
                </div>

                {/* Render Engine output display */}
                {!parsedSchema ? (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    No valid schema to preview. Correct errors in the editor tab.
                  </div>
                ) : (
                  <div className="max-w-xl mx-auto p-4 rounded-xl border border-slate-850 bg-slate-900/30">
                    {previewMode === 'form' ? (
                      <FormRenderer
                        fields={parsedSchema.fields || []}
                        onSubmit={(data) => {
                          toast.success('Form submitted successfully (Preview mode)');
                          console.log('Submitted data:', data);
                        }}
                        submitLabel={`Create ${parsedSchema.entity}`}
                      />
                    ) : (
                      <div className="overflow-hidden">
                        <TableRenderer
                          fields={parsedSchema.fields || []}
                          records={[
                            {
                              id: '1',
                              createdAt: new Date().toISOString(),
                              data: parsedSchema.fields.reduce((acc, f) => {
                                acc[f.name] =
                                  f.type === 'number'
                                    ? 4.0
                                    : f.type === 'checkbox'
                                    ? true
                                    : f.type === 'select'
                                    ? f.options?.[0] || 'A'
                                    : f.type === 'date'
                                    ? '2026-06-03'
                                    : `${f.name} Demo`;
                                return acc;
                              }, {} as Record<string, any>)
                            }
                          ]}
                          search=""
                          onSearchChange={() => {}}
                          page={1}
                          totalPages={1}
                          onPageChange={() => {}}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
