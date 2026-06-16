'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Activity,
  Users,
  Settings,
  LogOut,
  User,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Meetings', href: '/meetings', icon: Calendar },
    { name: 'Commitments', href: '/commitments', icon: CheckSquare },
    { name: 'Activity', href: '/activity', icon: Activity },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="fixed bottom-0 top-[72px] hidden w-[280px] border-r border-meetiq-border/50 bg-white md:flex flex-col">
      {/* Scrollable Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-blue-50 text-accent border-l-2 border-accent rounded-l-none'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors duration-150',
                  isActive ? 'text-accent' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom user profile panel */}
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full border-t border-meetiq-border/50 px-3 py-4 bg-slate-50/50 hover:bg-slate-100/50 transition-colors focus-visible:outline-none">
            <div className="flex items-center gap-3 text-left">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.display_name || 'User'} />
                <AvatarFallback className="bg-slate-200 text-slate-700 font-semibold text-xs">
                  {profile?.display_name ? getInitials(profile.display_name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-primary truncate font-heading">
                    {profile?.display_name || 'User'}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Online" />
                </div>
                <span className="text-xs text-muted-foreground truncate font-body">
                  {user.email || ''}
                </span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[256px] mr-3 p-3" align="start" side="top" sideOffset={12}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-primary font-heading">
                  {profile?.display_name || 'Anonymous User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {profile?.timezone || 'UTC'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push('/settings')} className="py-2">
              <User className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings?tab=workspace')} className="py-2">
              <Settings className="mr-2 h-4 w-4" />
              <span>Workspace Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} variant="destructive" className="py-2">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </aside>
  );
}
