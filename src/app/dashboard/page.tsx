'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import StatsCard from '@/components/stats-card';
import EmptyState from '@/components/empty-state';
import ConfirmDialog from '@/components/confirm-dialog';
import {
  Plus, Folder, Calendar, ArrowRight, Loader2, Code, Layout, AlertCircle,
  LayoutGrid, Database, Layers, Search, SortAsc, SortDesc, MoreVertical,
  Edit2, Trash2, Copy, X, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

type SortKey = 'newest' | 'oldest' | 'name-asc' | 'name-desc';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppDesc, setNewAppDesc] = useState('');

  // Edit modal state
  const [editApp, setEditApp] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  // Search + sort
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');

  // Dropdown open tracker
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Fetch applications
  const { data: applications = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['applications'],
    queryFn: async () => {
      const res = await fetch('/api/applications');
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to load applications');
      return data.data;
    },
    enabled: !!session,
  });

  // ── Analytics ──
  const totalEntities = useMemo(
    () => applications.reduce((sum, app) => sum + (app.entities?.length || 0), 0),
    [applications]
  );

  // ── Filtered & sorted apps ──
  const filteredApps = useMemo(() => {
    let list = [...applications];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.description || '').toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case 'newest': list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case 'oldest': list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case 'name-asc': list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': list.sort((a, b) => b.name.localeCompare(a.name)); break;
    }
    return list;
  }, [applications, search, sort]);

  // ── Create mutation ──
  const createMutation = useMutation({
    mutationFn: async (newApp: { name: string; description: string }) => {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to create application');
      return data.data;
    },
    onSuccess: (newApp) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success(`Application "${newApp.name}" created!`);
      setIsCreateOpen(false);
      setNewAppName('');
      setNewAppDesc('');
      router.push(`/app/${newApp.id}/builder`);
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create application'),
  });

  // ── Edit mutation ──
  const editMutation = useMutation({
    mutationFn: async (payload: { id: string; name: string; description: string }) => {
      const res = await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to update application');
      return data.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success(`"${updated.name}" updated!`);
      setEditApp(null);
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update'),
  });

  // ── Delete mutation ──
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/applications?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to delete');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application deleted successfully');
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete'),
  });

  // ── Duplicate mutation (create copy) ──
  const duplicateMutation = useMutation({
    mutationFn: async (app: any) => {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${app.name} (Copy)`,
          description: app.description,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (newApp) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success(`"${newApp.name}" created as duplicate!`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) { toast.error('Application name is required.'); return; }
    createMutation.mutate({ name: newAppName.trim(), description: newAppDesc.trim() });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) { toast.error('Application name is required.'); return; }
    editMutation.mutate({ id: editApp.id, name: editName.trim(), description: editDesc.trim() });
  };

  const openEdit = (app: any) => {
    setEditApp(app);
    setEditName(app.name);
    setEditDesc(app.description || '');
    setOpenMenu(null);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      {/* Close dropdown on outside click */}
      {openMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
      )}

      <div className="space-y-8 animate-fade-in-up">

        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">
              {session?.user?.name ? `${session.user.name.split(' ')[0]}'s Workspace` : 'My Applications'}
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Manage, design, and run your metadata-driven applications.</p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Application
          </button>
        </div>

        {/* ── Analytics Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            label="Total Applications"
            value={isLoading ? 0 : applications.length}
            icon={LayoutGrid}
            color="blue"
            isLoading={isLoading}
            sublabel="All time"
          />
          <StatsCard
            label="Total Entities"
            value={isLoading ? 0 : totalEntities}
            icon={Layers}
            color="indigo"
            isLoading={isLoading}
            sublabel="Across all apps"
          />
          <StatsCard
            label="Active Applications"
            value={isLoading ? 0 : applications.filter((a) => (a.entities?.length || 0) > 0).length}
            icon={Database}
            color="emerald"
            isLoading={isLoading}
            sublabel="Have at least 1 entity"
          />
        </div>

        {/* ── Search + Sort ── */}
        {!isLoading && applications.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search applications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all hover:border-slate-700"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium shrink-0">Sort:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Name A→Z</option>
                <option value="name-desc">Name Z→A</option>
              </select>
            </div>
          </div>
        )}

        {/* ── Application Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-52 border border-slate-800 rounded-2xl skeleton" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{(error as Error).message}</span>
          </div>
        ) : applications.length === 0 ? (
          <EmptyState
            icon={Folder}
            title="No applications yet"
            description="MetaForge applications are schema-driven containers where you define data entities and instantly generate API endpoints, forms, and tables."
            action={{ label: 'Create your first application', onClick: () => setIsCreateOpen(true), icon: Plus }}
            size="lg"
          />
        ) : filteredApps.length === 0 ? (
          <EmptyState
            icon={Search}
            title={`No results for "${search}"`}
            description="Try a different search term or clear the filter."
            action={{ label: 'Clear search', onClick: () => setSearch('') }}
            size="md"
          />
        ) : (
          <>
            {search && (
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-300">{filteredApps.length}</span> of{' '}
                <span className="font-semibold text-slate-300">{applications.length}</span> applications
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="group flex flex-col justify-between p-5 rounded-2xl border border-slate-800 bg-slate-900/20 hover:border-slate-700 transition-all duration-200 glass-panel hover:shadow-lg hover:shadow-blue-500/5 relative"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <Layout className="h-4.5 w-4.5 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-200 group-hover:text-blue-300 transition-colors text-base truncate">
                            {app.name}
                          </h3>
                        </div>
                      </div>

                      {/* Actions Menu */}
                      <div className="relative shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === app.id ? null : app.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="More options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openMenu === app.id && (
                          <div className="absolute right-0 top-8 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-20 overflow-hidden animate-slide-down">
                            <button
                              onClick={() => openEdit(app)}
                              className="flex items-center w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors cursor-pointer"
                            >
                              <Edit2 className="mr-2.5 h-4 w-4 text-slate-500" />
                              Edit Details
                            </button>
                            <button
                              onClick={() => { duplicateMutation.mutate(app); setOpenMenu(null); }}
                              className="flex items-center w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors cursor-pointer"
                            >
                              <Copy className="mr-2.5 h-4 w-4 text-slate-500" />
                              Duplicate
                            </button>
                            <div className="border-t border-slate-800">
                              <button
                                onClick={() => { setDeleteTarget(app); setOpenMenu(null); }}
                                className="flex items-center w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors cursor-pointer"
                              >
                                <Trash2 className="mr-2.5 h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 min-h-[40px]">
                      {app.description || <span className="text-slate-600 italic">No description provided.</span>}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-5 border-t border-slate-800/60 pt-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center">
                        <Code className="mr-1.5 h-3.5 w-3.5" />
                        {app.entities?.length || 0} {app.entities?.length === 1 ? 'entity' : 'entities'}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="mr-1.5 h-3.5 w-3.5" />
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/app/${app.id}/builder`}
                        className="flex-1 text-center py-2 px-3 border border-slate-700 bg-slate-800/40 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-all"
                      >
                        Schema Builder
                      </Link>
                      <Link
                        href={app.entities?.length > 0 ? `/app/${app.id}/runtime/${app.entities[0].id}` : '#'}
                        onClick={(e: React.MouseEvent) => {
                          if (!app.entities?.length) {
                            e.preventDefault();
                            toast.error('Create at least one entity first to enter runtime.');
                          }
                        }}
                        className={`flex-1 text-center py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                          app.entities?.length > 0
                            ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20'
                            : 'bg-slate-900/20 border border-slate-800 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        Launch App
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Create Application Modal ── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl glass-panel animate-fade-in-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-100">New Application</h2>
                <p className="text-xs text-slate-400 mt-0.5">Create a schema-driven runtime container.</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="modalAppName" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Application Name <span className="text-blue-400">*</span>
                </label>
                <input
                  id="modalAppName"
                  type="text"
                  placeholder="e.g. Student Management"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label htmlFor="modalAppDesc" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Description <span className="text-slate-600 font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  id="modalAppDesc"
                  placeholder="Briefly describe what this application manages..."
                  value={newAppDesc}
                  onChange={(e) => setNewAppDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-700 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="inline-flex items-center px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/20"
                >
                  {createMutation.isPending && <Loader2 className="animate-spin mr-1.5 h-4 w-4" />}
                  Create Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Application Modal ── */}
      {editApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl glass-panel animate-fade-in-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Edit Application</h2>
                <p className="text-xs text-slate-400 mt-0.5">Update name and description.</p>
              </div>
              <button onClick={() => setEditApp(null)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Application Name <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  required
                  autoFocus
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditApp(null)} className="px-4 py-2 border border-slate-700 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editMutation.isPending}
                  className="inline-flex items-center px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/20"
                >
                  {editMutation.isPending && <Loader2 className="animate-spin mr-1.5 h-4 w-4" />}
                  <Save className="mr-1.5 h-4 w-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Dialog ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Application"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will permanently delete all entities and records associated with this application. This action cannot be undone.`}
        confirmLabel="Delete Application"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </DashboardLayout>
  );
}
