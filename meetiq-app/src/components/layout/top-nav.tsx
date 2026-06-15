'use client';

import React from 'react';
import { WorkspaceSwitcher } from '@/features/workspace/components/workspace-switcher';
import { CommandPalette } from '@/components/layout/command-palette';
import { NotificationBell } from '@/components/layout/notification-bell';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import Image from 'next/image';
import Link from 'next/link';

export function TopNav() {
  const { currentWorkspace } = useCurrentWorkspace();

  const initial = currentWorkspace?.name?.charAt(0).toUpperCase() || 'M';

  return (
    <header className="sticky top-0 z-40 flex h-[72px] w-full items-center justify-between border-b border-meetiq-border/50 bg-white px-4 md:px-6">
      {/* Left section: Logo & Spacer */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center focus-visible:outline-none">
          <Image
            src="/meetiq-logo.png"
            alt="MeetIQ"
            width={120}
            height={32}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>
      </div>

      {/* Right section: Search, Notifications, Workspace */}
      <div className="flex items-center gap-3">
        <CommandPalette />
        <div className="h-[18px] w-[1px] bg-meetiq-border hidden sm:block" />
        <NotificationBell />
        <div className="h-[18px] w-[1px] bg-meetiq-border hidden sm:block" />
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white select-none">
            {initial}
          </div>
          <WorkspaceSwitcher />
        </div>
      </div>
    </header>
  );
}
