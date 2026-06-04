'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, Bell, Settings, LogOut, Code2, User, ChevronDown, Menu, X } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Fetch notifications to get unread count
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      return data.success ? data.data : [];
    },
    enabled: !!session,
    refetchInterval: 10000,
  });

  const unreadCount = notifications.filter((n) => !n.readStatus).length;

  const navigation = [
    { name: 'My Applications', href: '/dashboard', icon: LayoutGrid },
    { name: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || session?.user?.email?.charAt(0)?.toUpperCase() || 'U';

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-slate-800/60 bg-slate-950/80 backdrop-blur-xl z-30">
        <div className="flex flex-col flex-grow overflow-y-auto">
          
          {/* Logo */}
          <div className="flex items-center px-6 py-5 border-b border-slate-800/50">
            <Link href="/dashboard" className="flex items-center space-x-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-blue-600/15 border border-blue-500/25 flex items-center justify-center transition-all group-hover:bg-blue-600/25">
                <Code2 className="h-4.5 w-4.5 text-blue-400" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                MetaForge
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            <p className="px-3 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Navigation</p>
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                    active
                      ? 'bg-blue-600/12 text-blue-400 border border-blue-500/15'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-4.5 w-4.5 shrink-0 transition-colors ${
                      active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="flex-grow">{item.name}</span>
                  {item.badge !== undefined && (
                    <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold bg-blue-500 text-white">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="flex-shrink-0 border-t border-slate-800/50 p-3">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center w-full px-3 py-2.5 rounded-xl hover:bg-slate-800/60 transition-colors group cursor-pointer"
            >
              {/* Avatar */}
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {userInitial}
              </div>
              <div className="ml-3 flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-slate-200 truncate">{session?.user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
              </div>
              <ChevronDown className={`ml-1 h-4 w-4 text-slate-500 transition-transform shrink-0 ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* User dropdown menu */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-slide-down z-50">
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                >
                  <User className="mr-3 h-4 w-4 text-slate-500" />
                  Account Settings
                </Link>
                <div className="border-t border-slate-800">
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-950 border-r border-slate-800 flex flex-col animate-slide-down">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Code2 className="h-5 w-5 text-blue-400" />
                <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">MetaForge</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-blue-600/12 text-blue-400 border border-blue-500/15'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
                    {item.name}
                    {item.badge !== undefined && (
                      <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold bg-blue-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-slate-800 p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                  {userInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{session?.user?.name || 'User'}</p>
                  <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center w-full px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/30 transition-colors cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="md:pl-64 flex flex-col flex-1 min-w-0">
        
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl px-4 py-3 sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard" className="flex items-center space-x-2">
            <Code2 className="h-5 w-5 text-blue-400" />
            <span className="text-base font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">MetaForge</span>
          </Link>

          <Link href="/notifications" className="relative p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-slate-950" />
            )}
          </Link>
        </header>

        {/* Content body */}
        <main className="flex-1 p-5 md:p-8 max-w-7xl w-full mx-auto animate-fade-in-up">
          {children}
        </main>
      </div>
    </div>
  );
}
