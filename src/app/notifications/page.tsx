'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import RuntimeErrorBoundary from '@/components/runtime/error-boundary';
import EmptyState from '@/components/empty-state';
import { Bell, Check, Loader2, MailOpen, AlertCircle, Inbox, BellOff } from 'lucide-react';
import toast from 'react-hot-toast';

type FilterTab = 'all' | 'unread' | 'read';

function groupByDate(notifications: any[]) {
  const groups: Record<string, any[]> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);

  notifications.forEach((n) => {
    const date = new Date(n.createdAt);
    date.setHours(0, 0, 0, 0);

    let key: string;
    if (date.getTime() === today.getTime()) key = 'Today';
    else if (date.getTime() === yesterday.getTime()) key = 'Yesterday';
    else if (date >= thisWeek) key = 'This Week';
    else key = 'Older';

    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });

  return groups;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterTab>('all');

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
    onError: (err: Error) => toast.error(err.message || 'Failed to update notification'),
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

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.readStatus;
    if (filter === 'read') return n.readStatus;
    return true;
  });

  const groups = groupByDate(filtered);
  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older'];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-400" />
              </div>
              <span>Notification Center</span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full text-xs font-bold bg-blue-500 text-white">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 pl-11">Workflow triggers and system audit messages.</p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markReadMutation.isPending}
              className="inline-flex items-center px-3.5 py-2 border border-slate-800 bg-slate-900/60 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Check className="mr-1.5 h-4 w-4 text-emerald-400" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-slate-900/40 p-1.5 rounded-xl border border-slate-800 w-fit">
          {(['all', 'unread', 'read'] as FilterTab[]).map((tab) => {
            const count = tab === 'all' ? notifications.length : tab === 'unread' ? unreadCount : notifications.length - unreadCount;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filter === tab
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="capitalize">{tab}</span>
                {count > 0 && (
                  <span className={`min-w-4 h-4 px-1 rounded text-[10px] font-bold inline-flex items-center justify-center ${
                    filter === tab ? 'bg-blue-500/20 text-blue-300' : 'text-slate-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <RuntimeErrorBoundary>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-20 border border-slate-800 bg-slate-900/20 rounded-xl skeleton" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{(error as Error).message}</span>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={filter === 'unread' ? BellOff : MailOpen}
              title={filter === 'unread' ? 'All caught up!' : filter === 'read' ? 'No read notifications' : 'No notifications yet'}
              description={
                filter === 'unread'
                  ? 'You have no unread notifications.'
                  : filter === 'read'
                  ? 'Notifications that you have read will appear here.'
                  : 'Create dynamic workflows to trigger alert logs on database record events.'
              }
              size="md"
            />
          ) : (
            <div className="space-y-6">
              {groupOrder.map((groupKey) => {
                const groupItems = groups[groupKey];
                if (!groupItems || groupItems.length === 0) return null;
                return (
                  <div key={groupKey} className="space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">{groupKey}</p>
                    {groupItems.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.readStatus && handleMarkSingleRead(n.id)}
                        className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 glass-panel group ${
                          n.readStatus
                            ? 'bg-slate-900/10 border-slate-800/60 opacity-70'
                            : 'bg-slate-900/35 border-slate-700 hover:border-slate-600 hover:shadow-md cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          {/* Unread dot */}
                          <div className="mt-1.5 shrink-0">
                            {n.readStatus ? (
                              <div className="h-2 w-2 rounded-full bg-slate-700" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className={`font-semibold text-sm leading-snug ${n.readStatus ? 'text-slate-400' : 'text-slate-100'}`}>
                              {n.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 gap-2">
                          <span className="text-[10px] text-slate-600 whitespace-nowrap">
                            {new Date(n.createdAt).toLocaleTimeString(undefined, { timeStyle: 'short' })}
                          </span>
                          {!n.readStatus && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMarkSingleRead(n.id); }}
                              className="text-[10px] text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-all font-semibold cursor-pointer whitespace-nowrap"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </RuntimeErrorBoundary>
      </div>
    </DashboardLayout>
  );
}
