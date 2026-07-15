'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  FileText,
  UploadCloud,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Organizations', href: '/dashboard/organizations', icon: Building2 },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Articles', href: '/dashboard/articles', icon: FileText },
  { name: 'Import', href: '/dashboard/import', icon: UploadCloud },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  if (status === 'loading') {
    return <Loader fullPage />;
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900/40 backdrop-blur-xl">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-100 dark:border-slate-850">
          <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/20">
            SLR
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Easy<span className="text-primary-600 dark:text-primary-400">SLR</span>
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-50 text-primary-750 dark:bg-primary-950/45 dark:text-primary-400 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/35 hover:text-slate-950 dark:hover:text-slate-100'
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-350'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile section at bottom of sidebar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-slate-850 flex items-center justify-center text-primary-700 dark:text-primary-400">
              <User className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-center gap-2 border-slate-200 dark:border-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 dark:hover:border-red-900/50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 flex flex-col transition-transform duration-300 md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-slate-805">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold">
              SLR
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              Easy<span className="text-primary-600 dark:text-primary-400">SLR</span>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-600"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="h-4.5 w-4.5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-750 dark:bg-primary-950/45 dark:text-primary-400 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/35 hover:text-slate-950 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-slate-850 flex items-center justify-center text-primary-700 dark:text-primary-400">
              <User className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-center gap-2 border-slate-200 dark:border-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900/40 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 md:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Workspace</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-600 dark:text-slate-400">EasySLR Client</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8.5 w-8.5 rounded-full bg-primary-100 dark:bg-slate-800 flex items-center justify-center text-primary-700 dark:text-primary-400 font-semibold text-sm">
                {(session?.user?.name || 'A')[0].toUpperCase()}
              </div>
              <span className="hidden sm:inline-block text-sm font-semibold text-slate-700 dark:text-slate-350">
                {session?.user?.name || 'Admin'}
              </span>
            </div>
          </div>
        </header>

        {/* Content Page wrapper */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
