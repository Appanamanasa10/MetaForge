'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import RuntimeErrorBoundary from '@/components/runtime/error-boundary';
import { Bell, Check, Loader2, MailOpen, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: !!session,
  });

  // Mark read mutation
  const markReadMutation = useMutation({
    mutationFn: async (payload: { id?: string; all?: boolean }) => {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update notification');
    }
  });

  const handleMarkAllRead = () => {
    markReadMutation.mutate({ all: true });
    toast.success('All notifications marked as read.');
  };

  const handleMarkSingleRead = (id: string) => {
    markReadMutation.mutate({ id });
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

  const unreadCount = notifications.filter((n) => !n.readStatus).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
              <Bell className="h-6 w-6 text-blue-500" />
              <span>Notification Center</span>
            </h1>
            <p className="text-xs text-slate-500">View workflow trigger notifications and system audit messages.</p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center px-3.5 py-2 border border-slate-800 bg-slate-900/60 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Check className="mr-1.5 h-4 w-4 text-emerald-450" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Content list */}
        <RuntimeErrorBoundary>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-16 border border-slate-900 bg-slate-900/20 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 shrink-0 animate-pulse" />
              <span>{(error as Error).message}</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-slate-880 bg-slate-900/10 glass-panel">
              <MailOpen className="mx-auto h-12 w-12 text-slate-650" />
              <h3 className="mt-4 text-sm font-semibold text-slate-350">You are all caught up!</h3>
              <p className="mt-2 text-xs text-slate-500">
                No notifications logged. Create dynamic workflows to trigger alert logs on database actions.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.readStatus && handleMarkSingleRead(n.id)}
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 glass-panel cursor-pointer group ${
                    n.readStatus
                      ? 'bg-slate-900/10 border-slate-900/80 text-slate-400 opacity-80'
                      : 'bg-slate-900/35 border-slate-800 hover:border-slate-750 hover:shadow-md hover:shadow-blue-500/2 text-slate-100'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {!n.readStatus && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 animate-pulse"></span>
                      )}
                      <h4 className="font-semibold text-sm">{n.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400 pl-4">{n.message}</p>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-2">
                    <span className="text-[10px] text-slate-500">
                      {new Date(n.createdAt).toLocaleDateString()} at{' '}
                      {new Date(n.createdAt).toLocaleTimeString(undefined, { timeStyle: 'short' })}
                    </span>
                    {!n.readStatus && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkSingleRead(n.id);
                        }}
                        className="text-[10px] text-blue-450 hover:text-blue-350 opacity-0 group-hover:opacity-100 transition-opacity font-semibold cursor-pointer"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </RuntimeErrorBoundary>
      </div>
    </DashboardLayout>
  );
}
