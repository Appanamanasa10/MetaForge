'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { Plus, Folder, Calendar, ArrowRight, Loader2, Code, Layout, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppDesc, setNewAppDesc] = useState('');

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

  // Create application mutation
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
      setIsModalOpen(false);
      setNewAppName('');
      setNewAppDesc('');
      router.push(`/app/${newApp.id}/builder`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create application');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) {
      toast.error('Application name is required.');
      return;
    }
    createMutation.mutate({
      name: newAppName.trim(),
      description: newAppDesc.trim(),
    });
  };

  // Redirect unauthenticated users
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">My Applications</h1>
            <p className="text-slate-400 mt-1">Manage, design, and run your metadata-driven applications.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="mr-1.5 h-4.5 w-4.5" />
            Create Application
          </button>
        </div>

        {/* Dashboard Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-44 border border-slate-900 bg-slate-900/20 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{(error as Error).message}</span>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 glass-panel">
            <Folder className="mx-auto h-12 w-12 text-slate-655" />
            <h3 className="mt-4 text-lg font-semibold text-slate-300">No applications created yet</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
              MetaForge applications are schema-driven containers where you define data entities and deploy instant API/forms.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer"
              >
                <Plus className="mr-1.5 h-4.5 w-4.5" />
                Create your first application
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app) => (
              <div
                key={app.id}
                className="group flex flex-col justify-between p-6 rounded-xl border border-slate-900 bg-slate-900/20 hover:border-slate-800 transition-all duration-200 glass-panel relative hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <Layout className="h-5 w-5 text-blue-400" />
                    <h3 className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors text-lg truncate">
                      {app.name}
                    </h3>
                  </div>
                  <p className="mt-3 text-slate-400 text-sm leading-relaxed line-clamp-2 min-h-[40px]">
                    {app.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-900/80 pt-4 flex flex-col space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-550">
                    <span className="flex items-center">
                      <Code className="mr-1 h-3.5 w-3.5" />
                      {app.entities?.length || 0} Entities
                    </span>
                    <span className="flex items-center">
                      <Calendar className="mr-1 h-3.5 w-3.5" />
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/app/${app.id}/builder`}
                      className="flex-1 text-center py-2 px-3 border border-slate-800 bg-slate-900/40 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-all"
                    >
                      Design Schema
                    </Link>
                    <Link
                      href={app.entities?.length > 0 ? `/app/${app.id}/runtime/${app.entities[0].id}` : '#'}
                      onClick={(e: React.MouseEvent) => {
                        if (!app.entities?.length) {
                          e.preventDefault();
                          toast.error('Create at least one entity first to enter runtime.');
                        }
                      }}
                      className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                        app.entities?.length > 0
                          ? 'bg-blue-600/10 border border-blue-550/20 text-blue-400 hover:bg-blue-600/20'
                          : 'bg-slate-950/20 border border-slate-900 text-slate-600 cursor-not-allowed'
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
        )}

        {/* Create App Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-850 p-6 rounded-xl shadow-2xl glass-panel relative">
              <h2 className="text-xl font-bold text-slate-100">Create New Application</h2>
              <p className="text-sm text-slate-400 mt-1">Provide a name and optional description for your new runtime container.</p>

              <form onSubmit={handleCreateSubmit} className="mt-6 space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="modalAppName" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Application Name
                  </label>
                  <input
                    id="modalAppName"
                    type="text"
                    placeholder="e.g. Student Management"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-750 transition-all text-sm"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="modalAppDesc" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    id="modalAppDesc"
                    placeholder="Briefly describe what this application does..."
                    value={newAppDesc}
                    onChange={(e) => setNewAppDesc(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-750 transition-all text-sm"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-800 rounded-lg text-sm font-semibold text-slate-350 hover:bg-slate-800 hover:text-slate-150 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="inline-flex justify-center items-center px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {createMutation.isPending && <Loader2 className="animate-spin mr-1.5 h-4 w-4" />}
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
