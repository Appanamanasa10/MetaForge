'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import FormRenderer from '@/components/runtime/form-renderer';
import TableRenderer from '@/components/runtime/table-renderer';
import ConfirmDialog from '@/components/confirm-dialog';
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
  AlertTriangle,
  Sparkles,
  Workflow,
  Copy,
  ChevronDown,
  CheckCircle2
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

const QUICK_TEMPLATES: { label: string; icon: string; schema: EntitySchema }[] = [
  {
    label: 'Contact',
    icon: '👤',
    schema: {
      entity: 'Contact',
      fields: [
        { name: 'fullName', type: 'text', required: true, placeholder: 'Full name' },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text', placeholder: '+1 555-000-0000' },
        { name: 'company', type: 'text', placeholder: 'Company name' },
        { name: 'notes', type: 'textarea', placeholder: 'Additional notes...' },
      ]
    }
  },
  {
    label: 'Product',
    icon: '📦',
    schema: {
      entity: 'Product',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'sku', type: 'text', required: true, placeholder: 'SKU-001' },
        { name: 'price', type: 'number', required: true },
        { name: 'category', type: 'select', options: ['Electronics', 'Clothing', 'Food', 'Other'] },
        { name: 'inStock', type: 'checkbox', placeholder: 'Currently in stock' },
        { name: 'description', type: 'textarea' },
      ]
    }
  },
  {
    label: 'Task',
    icon: '✅',
    schema: {
      entity: 'Task',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        { name: 'status', type: 'select', options: ['Todo', 'In Progress', 'Review', 'Done'], defaultValue: 'Todo' },
        { name: 'priority', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
        { name: 'dueDate', type: 'date' },
        { name: 'completed', type: 'checkbox' },
      ]
    }
  },
  {
    label: 'Employee',
    icon: '🏢',
    schema: {
      entity: 'Employee',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'department', type: 'select', options: ['Engineering', 'Design', 'Marketing', 'Sales', 'HR'] },
        { name: 'role', type: 'text', placeholder: 'Job title' },
        { name: 'salary', type: 'number' },
        { name: 'startDate', type: 'date' },
        { name: 'isActive', type: 'checkbox', placeholder: 'Currently active', defaultValue: true },
      ]
    }
  },
];

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

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

  // Live validate JSON input
  const handleJsonChange = (val: string) => {
    setJsonInput(val);
    if (!val.trim()) {
      setValidationError('Schema cannot be empty');
      setParsedSchema(null);
      return;
    }

    try {
      const parsed = JSON.parse(val);
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
    onError: (err: Error) => toast.error(err.message || 'Failed to save entity'),
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
      const res = await fetch(`/api/entities?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', appId] });
      queryClient.invalidateQueries({ queryKey: ['application', appId] });
      toast.success('Entity deleted');
      setSelectedEntityId(null);
      setJsonInput('');
      setParsedSchema(null);
      setShowDeleteConfirm(false);
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete entity'),
  });

  const handleCreateNewEntity = () => {
    setSelectedEntityId(null);
    const defaultSchemaStr = JSON.stringify(DEFAULT_SCHEMA, null, 2);
    setJsonInput(defaultSchemaStr);
    setParsedSchema(DEFAULT_SCHEMA);
    setValidationError(null);
    setActiveTab('editor');
  };

  const handleApplyTemplate = (schema: EntitySchema) => {
    setSelectedEntityId(null);
    const str = JSON.stringify(schema, null, 2);
    setJsonInput(str);
    setParsedSchema(schema);
    setValidationError(null);
    setActiveTab('editor');
    setShowTemplates(false);
    toast.success(`"${schema.entity}" template loaded!`);
  };

  const handleDuplicate = () => {
    if (!parsedSchema) return;
    const duplicated: EntitySchema = {
      ...parsedSchema,
      entity: `${parsedSchema.entity} Copy`,
    };
    setSelectedEntityId(null);
    const str = JSON.stringify(duplicated, null, 2);
    setJsonInput(str);
    setParsedSchema(duplicated);
    setValidationError(null);
    setActiveTab('editor');
    toast.success('Entity duplicated — save to create it.');
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1.5">
              <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Applications</Link>
              <span>/</span>
              <span className="text-slate-400">{application?.name}</span>
              <span>/</span>
              <span className="text-slate-300 font-medium">Schema Builder</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Application Schema Builder</h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/app/${appId}/workflows`}
              className="inline-flex items-center px-3.5 py-2 border border-slate-800 bg-slate-900/40 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Workflow className="mr-1.5 h-4 w-4 text-blue-400" />
              Workflows
            </Link>
            {selectedEntityId && (
              <Link
                href={`/app/${appId}/runtime/${selectedEntityId}`}
                className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 transition-colors"
              >
                <Play className="mr-1.5 h-4 w-4" />
                Launch Runtime
              </Link>
            )}
          </div>
        </div>

        {/* Builder Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Left panel: entity listing */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 glass-panel">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entities</h3>
                <div className="flex items-center gap-1">
                  {/* Templates dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 cursor-pointer transition-colors"
                      title="Quick Templates"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </button>
                    {showTemplates && (
                      <div className="absolute left-0 top-8 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-20 overflow-hidden animate-slide-down">
                        <p className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">Quick Templates</p>
                        {QUICK_TEMPLATES.map((t) => (
                          <button
                            key={t.label}
                            onClick={() => handleApplyTemplate(t.schema)}
                            className="flex items-center w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <span className="mr-2.5 text-base">{t.icon}</span>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleCreateNewEntity}
                    className="p-1 rounded bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 cursor-pointer transition-colors"
                    title="New Entity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {entities.length === 0 && !parsedSchema ? (
                <div className="text-center py-6 space-y-3">
                  <p className="text-xs text-slate-500">No entities yet.</p>
                  <button
                    onClick={handleCreateNewEntity}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                  >
                    + Create first entity
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {entities.map((ent) => {
                    const isSelected = selectedEntityId === ent.id;
                    return (
                      <button
                        key={ent.id}
                        onClick={() => setSelectedEntityId(ent.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600/10 border border-blue-500/15 text-blue-400'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        <span className="truncate">{ent.name}</span>
                        <span className="text-[10px] text-slate-600 font-mono shrink-0 ml-1">
                          {ent.schemaJson?.fields?.length || 0}f
                        </span>
                      </button>
                    );
                  })}
                  {!selectedEntityId && parsedSchema && (
                    <button
                      className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium bg-blue-600/10 border border-blue-500/15 text-blue-400"
                      disabled
                    >
                      <span className="italic truncate">{parsedSchema.entity} [unsaved]</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Field type quick-ref */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/10 text-xs text-slate-500 space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Field Types</h4>
              {['text', 'textarea', 'email', 'number', 'select', 'checkbox', 'date'].map((t) => (
                <code key={t} className="block text-blue-400/70 font-mono">{t}</code>
              ))}
            </div>
          </div>

          {/* Right panel: Editor & Live Preview */}
          <div className="lg:col-span-3 space-y-4">

            {/* Tab Header */}
            <div className="flex items-center justify-between bg-slate-900/40 p-2 rounded-xl border border-slate-800 glass-panel">
              <div className="flex space-x-1">
                {(['editor', 'preview'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === tab
                        ? 'bg-slate-800 text-slate-100 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    {tab === 'editor' ? <Code className="mr-1.5 h-4 w-4" /> : <Eye className="mr-1.5 h-4 w-4" />}
                    {tab === 'editor' ? 'JSON Editor' : 'Live Preview'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                {activeTab === 'editor' && (
                  <button
                    onClick={formatJson}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium cursor-pointer transition-colors"
                  >
                    Format
                  </button>
                )}
                {parsedSchema && (
                  <button
                    onClick={handleDuplicate}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Duplicate Entity"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={handleSaveSchema}
                  disabled={saveMutation.isPending || !!validationError || !parsedSchema}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white transition-all cursor-pointer shadow-lg shadow-blue-500/15"
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
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                    title="Delete Entity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Validation status bar */}
            {jsonInput && (
              <div className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium border ${
                validationError
                  ? 'border-red-500/20 bg-red-950/10 text-red-400'
                  : 'border-emerald-500/20 bg-emerald-950/10 text-emerald-400'
              }`}>
                {validationError ? (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-mono">{validationError}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Schema is valid — {parsedSchema?.fields?.length || 0} fields defined</span>
                  </>
                )}
              </div>
            )}

            {/* Editor Tab */}
            {activeTab === 'editor' && (
              <div className="relative rounded-xl border border-slate-800 bg-slate-950/80">
                <div className="flex items-center justify-between text-xs text-slate-500 px-4 pt-3 pb-2 border-b border-slate-800">
                  <span className="flex items-center">
                    <FileJson className="mr-1.5 h-4 w-4 text-blue-500" />
                    schema.json
                  </span>
                  <span className="text-slate-600">Entity Schema Definition</span>
                </div>
                <textarea
                  value={jsonInput}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  rows={20}
                  placeholder='{\n  "entity": "MyEntity",\n  "fields": []\n}'
                  className="w-full bg-transparent text-slate-200 font-mono text-sm leading-relaxed focus:outline-none resize-y min-h-[300px] p-4"
                  style={{ tabSize: 2 }}
                />
              </div>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && (
              <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/10 glass-panel space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">
                      Live Preview: {parsedSchema?.entity || 'Entity'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Rendered output of your schema configuration.</p>
                  </div>
                  <div className="flex space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
                    {(['form', 'table'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setPreviewMode(mode)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                          previewMode === mode ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {mode === 'form' ? 'Form' : 'Table'}
                      </button>
                    ))}
                  </div>
                </div>

                {!parsedSchema ? (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    Fix schema errors in the editor to see a preview.
                  </div>
                ) : (
                  <div className="max-w-xl mx-auto p-4 rounded-xl border border-slate-800 bg-slate-900/30">
                    {previewMode === 'form' ? (
                      <FormRenderer
                        fields={parsedSchema.fields || []}
                        onSubmit={(data) => {
                          toast.success('Preview form submitted (no data saved)');
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
                                  f.type === 'number' ? 42
                                  : f.type === 'checkbox' ? true
                                  : f.type === 'select' ? f.options?.[0] || 'Option A'
                                  : f.type === 'date' ? '2026-06-04'
                                  : `Sample ${f.name}`;
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

      {/* Close templates on outside click */}
      {showTemplates && (
        <div className="fixed inset-0 z-10" onClick={() => setShowTemplates(false)} />
      )}

      {/* Delete confirm dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Entity"
        message={`Are you sure you want to delete "${parsedSchema?.entity}"? All associated data records will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete Entity"
        onConfirm={() => selectedEntityId && deleteMutation.mutate(selectedEntityId)}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </DashboardLayout>
  );
}
