'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import { TopNav } from '@/components/layout/top-nav';
import { Sidebar } from '@/components/layout/sidebar';
import { BottomTabBar } from '@/components/layout/bottom-tab-bar';
import { Loader2 } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { loading: workspaceLoading, workspaces } = useCurrentWorkspace();

  const isRoutingLoading = authLoading || workspaceLoading;

  useEffect(() => {
    if (authLoading) return;

    // Guard 1: Redirect unauthenticated user to login
    if (!user) {
      router.replace('/login');
      return;
    }
  }, [user, authLoading, router]);

  // Render a full-page loading state if authentication or workspace contexts are preparing
  if (isRoutingLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <span className="text-xs font-semibold text-muted-foreground uppercase font-heading">
            Loading MeetIQ...
          </span>
        </div>
      </div>
    );
  }

  // If unauthenticated or auth routes, let Next handle pages/guards (skip structural layout)
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  if (!user || isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TopNav />
      
      <div className="flex flex-1 pt-0">
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 md:pl-[280px] pb-16 md:pb-0">
          <div className="max-w-[1280px] mx-auto px-4 py-8 md:px-8">
            {children}
          </div>
        </main>
      </div>

      <BottomTabBar />
    </div>
  );
}
