'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Activity,
  Plus,
  Users,
  Settings,
  MoreHorizontal,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const leftTabs = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Meetings', href: '/meetings', icon: Calendar },
  ];

  const rightTabs = [
    { name: 'Commitments', href: '/commitments', icon: CheckSquare },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-meetiq-border/50 bg-white md:hidden">
      <div className="flex items-center justify-around h-14 pb-safe">
        {leftTabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full text-slate-500 transition-colors',
                isActive ? 'text-accent' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium mt-0.5">{tab.name}</span>
            </Link>
          );
        })}

        {/* Centered FAB Spacer */}
        <div className="flex-1 h-full pointer-events-none" />

        {rightTabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full text-slate-500 transition-colors',
                isActive ? 'text-accent' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium mt-0.5">{tab.name}</span>
            </Link>
          );
        })}

        {/* More menu drawer */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger
            render={
              <button className="flex flex-col items-center justify-center flex-1 h-full text-slate-500 hover:text-slate-900 focus-visible:outline-none" />
            }
          >
            <MoreHorizontal className="h-5 w-5 shrink-0" />
            <span className="text-[10px] font-medium mt-0.5">More</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl p-6">
            <SheetHeader className="text-left pb-4 border-b border-meetiq-border/50">
              <SheetTitle className="font-heading text-lg">Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 pt-4">
              <Button
                variant="ghost"
                className="justify-start text-slate-700 h-12 text-sm font-medium gap-3"
                onClick={() => {
                  setDrawerOpen(false);
                  router.push('/activity');
                }}
              >
                <Activity className="h-5 w-5 text-slate-400 shrink-0" />
                <span>Activity Feed</span>
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-slate-700 h-12 text-sm font-medium gap-3"
                onClick={() => {
                  setDrawerOpen(false);
                  router.push('/team');
                }}
              >
                <Users className="h-5 w-5 text-slate-400 shrink-0" />
                <span>Team Members</span>
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-slate-700 h-12 text-sm font-medium gap-3"
                onClick={() => {
                  setDrawerOpen(false);
                  router.push('/settings');
                }}
              >
                <Settings className="h-5 w-5 text-slate-400 shrink-0" />
                <span>Settings</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* FAB - Upload Meeting (56dp = h-14 w-14) */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-50">
        <Button
          onClick={() => router.push('/meetings/upload')}
          size="icon"
          className="h-14 w-14 rounded-full bg-accent text-white shadow-meetiq-md shadow-blue-500/20 hover:bg-blue-600 focus-visible:outline-none"
        >
          <Plus className="h-7 w-7" />
        </Button>
      </div>
    </div>
  );
}
