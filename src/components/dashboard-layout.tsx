'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, Bell, Settings, LogOut, Code2, PlusCircle, User } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Fetch notifications to get unread count
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      return data.success ? data.data : [];
    },
    enabled: !!session,
    refetchInterval: 10000, // Poll every 10s for active workflows notifications
  });

  const unreadCount = notifications.filter((n) => !n.readStatus).length;

  const navigation = [
    { name: 'My Applications', href: '/dashboard', icon: LayoutGrid },
    { name: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-slate-900 bg-slate-950/60 backdrop-blur-xl">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center px-6 space-x-2">
            <Code2 className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              MetaForge
            </span>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 pl-3.5'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 shrink-0 ${
                      isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-350'
                    }`}
                  />
                  <span className="flex-grow">{item.name}</span>
                  {item.badge !== undefined && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="flex-shrink-0 flex border-t border-slate-900 p-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                {session?.user?.name?.charAt(0) || <User className="h-4.5 w-4.5" />}
              </div>
              <div className="max-w-[120px] truncate">
                <p className="text-sm font-semibold text-slate-200 truncate">{session?.user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Mobile Header navigation bar */}
        <header className="md:hidden flex items-center justify-between border-b border-slate-900 bg-slate-950/60 backdrop-blur-xl px-4 py-3">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Code2 className="h-5.5 w-5.5 text-blue-500" />
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              MetaForge
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/notifications" className="relative p-1.5 text-slate-400 hover:text-slate-100">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-block h-2 w-2 rounded-full bg-blue-500 animate-ping"></span>
              )}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-slate-400 hover:text-red-450 p-1"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
