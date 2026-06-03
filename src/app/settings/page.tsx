'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import RuntimeErrorBoundary from '@/components/runtime/error-boundary';
import { Settings, User, Mail, Shield, Layout, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  // Sync session name to local input state
  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  // Fetch applications to display stats
  const { data: applications = [] } = useQuery<any[]>({
    queryKey: ['applications'],
    queryFn: async () => {
      const res = await fetch('/api/applications');
      const data = await res.json();
      return data.success ? data.data : [];
    },
    enabled: !!session,
  });

  // Profile update mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedName: string) => {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: updatedName }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: async (data) => {
      // Invalidate queries & update client session token
      queryClient.invalidateQueries({ queryKey: ['user'] });
      await updateSession({ name: data.name });
      toast.success('Profile settings updated successfully!');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update settings');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    updateMutation.mutate(name.trim());
  };

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
      <div className="space-y-6 max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
              <Settings className="h-6 w-6 text-blue-500" />
              <span>Account Settings</span>
            </h1>
            <p className="text-xs text-slate-550">Configure your profile details and inspect developer account limits.</p>
          </div>
        </div>

        <RuntimeErrorBoundary>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column: Form */}
            <div className="md:col-span-2 space-y-6">
              <div className="p-6 rounded-xl border border-slate-900 bg-slate-900/20 glass-panel">
                <h3 className="text-sm font-semibold text-slate-200 mb-6 flex items-center">
                  <User className="mr-2 h-4.5 w-4.5 text-blue-550" />
                  Profile Details
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="settingsName" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Display Name
                    </label>
                    <input
                      id="settingsName"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={updateMutation.isPending}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-750 transition-all text-sm font-medium"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5 opacity-60">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <Mail className="mr-1 h-3 w-3" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={session?.user?.email || ''}
                      disabled
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-900 bg-slate-950 text-slate-400 text-sm font-mono cursor-not-allowed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="inline-flex justify-center items-center px-4 py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/20"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="animate-spin mr-1.5 h-3.5 w-3.5" />
                    ) : (
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Save Profile Settings
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: account stats */}
            <div className="md:col-span-1 space-y-6">
              <div className="p-6 rounded-xl border border-slate-900 bg-slate-900/20 glass-panel space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center mb-1">
                    <Shield className="mr-2 h-4.5 w-4.5 text-blue-500" />
                    Security Provider
                  </h3>
                  <p className="text-xs text-slate-500">Active authorization identity node</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-900 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-450 font-semibold">Active Auth:</span>
                    <span className="font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 border border-blue-550/20 text-blue-400 text-[10px]">
                      {(session as any)?.user?.provider || 'Credentials'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-3">
                    <span className="text-slate-450 font-semibold flex items-center">
                      <Layout className="mr-1.5 h-3.5 w-3.5" />
                      Applications:
                    </span>
                    <span className="font-bold text-slate-200">{applications.length}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </RuntimeErrorBoundary>
      </div>
    </DashboardLayout>
  );
}
