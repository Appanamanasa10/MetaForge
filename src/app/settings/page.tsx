'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import RuntimeErrorBoundary from '@/components/runtime/error-boundary';
import ConfirmDialog from '@/components/confirm-dialog';
import { Settings, User, Mail, Shield, Layout, Save, Loader2, Database, LogOut, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  const { data: applications = [] } = useQuery<any[]>({
    queryKey: ['applications'],
    queryFn: async () => {
      const res = await fetch('/api/applications');
      const data = await res.json();
      return data.success ? data.data : [];
    },
    enabled: !!session,
  });

  const totalEntities = applications.reduce((sum: number, app: any) => sum + (app.entities?.length || 0), 0);

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
      queryClient.invalidateQueries({ queryKey: ['user'] });
      await updateSession({ name: data.name });
      toast.success('Profile updated successfully!');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update settings'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name cannot be empty.'); return; }
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

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || session?.user?.email?.charAt(0)?.toUpperCase() || 'U';

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                <Settings className="h-5 w-5 text-blue-400" />
              </div>
              <span>Account Settings</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 pl-11">Manage your profile and account preferences.</p>
          </div>
        </div>

        <RuntimeErrorBoundary>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* ── Left: Profile Form ── */}
            <div className="md:col-span-2 space-y-5">

              {/* Avatar + Profile Card */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20 glass-panel space-y-6">
                {/* Avatar display */}
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
                    {userInitial}
                  </div>
                  <div>
                    <p className="font-bold text-slate-200 text-lg">{session?.user?.name || 'User'}</p>
                    <p className="text-sm text-slate-500">{session?.user?.email}</p>
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase tracking-wider">
                      {(session as any)?.user?.provider || 'Credentials'}
                    </span>
                  </div>
                </div>

                {/* Profile form */}
                <div className="border-t border-slate-800 pt-5">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center">
                    <User className="mr-2 h-4 w-4 text-blue-400" />
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-600 transition-all text-sm font-medium"
                        required
                      />
                    </div>

                    <div className="flex flex-col space-y-1.5 opacity-60">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                        <Mail className="mr-1.5 h-3.5 w-3.5" />
                        Email Address
                        <span className="ml-2 text-slate-600 font-normal normal-case">(read-only)</span>
                      </label>
                      <input
                        type="email"
                        value={session?.user?.email || ''}
                        disabled
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 text-sm font-mono cursor-not-allowed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/20"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="animate-spin mr-1.5 h-4 w-4" />
                      ) : (
                        <Save className="mr-1.5 h-4 w-4" />
                      )}
                      Save Profile
                    </button>
                  </form>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="p-6 rounded-2xl border border-red-900/40 bg-red-950/10 glass-panel space-y-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                  <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-300">Sign Out</p>
                    <p className="text-xs text-slate-500 mt-0.5">End your current session and return to the login page.</p>
                  </div>
                  <button
                    onClick={() => setShowSignOutConfirm(true)}
                    className="inline-flex items-center px-4 py-2 border border-red-900/40 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                  >
                    <LogOut className="mr-1.5 h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

            {/* ── Right: Account Stats ── */}
            <div className="md:col-span-1 space-y-5">
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20 glass-panel space-y-5">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
                  <Shield className="h-4.5 w-4.5 text-blue-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Account Overview</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                    <span className="text-xs font-semibold text-slate-500 flex items-center">
                      <Shield className="mr-1.5 h-3.5 w-3.5" />
                      Auth Provider
                    </span>
                    <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      {(session as any)?.user?.provider || 'Credentials'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                    <span className="text-xs font-semibold text-slate-500 flex items-center">
                      <Layout className="mr-1.5 h-3.5 w-3.5" />
                      Applications
                    </span>
                    <span className="font-bold text-slate-200 text-lg">{applications.length}</span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs font-semibold text-slate-500 flex items-center">
                      <Database className="mr-1.5 h-3.5 w-3.5" />
                      Total Entities
                    </span>
                    <span className="font-bold text-slate-200 text-lg">{totalEntities}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </RuntimeErrorBoundary>
      </div>

      {/* Sign out confirmation */}
      <ConfirmDialog
        isOpen={showSignOutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out? Your data is saved and you can log back in any time."
        confirmLabel="Sign Out"
        onConfirm={() => signOut({ callbackUrl: '/login' })}
        onCancel={() => setShowSignOutConfirm(false)}
        variant="warning"
      />
    </DashboardLayout>
  );
}
