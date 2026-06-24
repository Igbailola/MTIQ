'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Loader2, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import type { Notification } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { NotificationDetailDialog } from './notification-detail-dialog';

import { logger } from '@/lib/logger';

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const { refreshWorkspaces } = useCurrentWorkspace();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch initial notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setNotifications(data || []);
        
        // Count unread
        const { count, error: countError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false);

        if (countError) throw countError;
        setUnreadCount(count || 0);
      } catch (err) {
        logger.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: { new: Notification }) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev.slice(0, 9)]);
          setUnreadCount((c) => c + 1);
          toast.info(newNotif.title, {
            description: newNotif.message,
            action: {
              label: 'View',
              onClick: () => handleNotificationClick(newNotif),
            },
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          setNotifications([]);
          setUnreadCount(0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const handleNotificationClick = async (notif: Notification) => {
    // Mark as read
    if (!notif.read) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notif.id);

        if (error) throw error;
        
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        logger.error('Error marking notification as read:', err);
      }
    }

    // Open detail modal
    setSelectedNotification({ ...notif, read: true });
  };

  const handleAcceptInvite = async (workspaceId: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ status: 'active' })
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId);

      if (error && (error.message?.includes('status') || error.code === 'PGRST100')) {
        const { data: exists } = await supabase
          .from('workspace_members')
          .select('*')
          .eq('user_id', user.id)
          .eq('workspace_id', workspaceId)
          .maybeSingle();

        if (!exists) {
          await supabase.from('workspace_members').insert({
            user_id: user.id,
            workspace_id: workspaceId,
            role: 'member',
          });
        }
      } else if (error) {
        throw error;
      }

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId)
        .eq('type', 'member_invited');

      try {
        await supabase.from('notifications').insert({
          user_id: user.id,
          workspace_id: workspaceId,
          type: 'member_accepted',
          title: 'Workspace Joined',
          message: 'You have joined the workspace.',
        });
      } catch {} // non-critical;

      localStorage.setItem('meetiq_current_workspace', workspaceId);
      toast.success('Joined workspace successfully!');

      setNotifications((prev) =>
        prev.map((n) =>
          n.workspace_id === workspaceId && n.type === 'member_invited'
            ? { ...n, read: true }
            : n
        )
      );

      setSelectedNotification(null);
      await refreshWorkspaces();
      router.push('/dashboard');
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to join workspace');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineInvite = async (workspaceId: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId)
        .eq('type', 'member_invited');

      toast.success('Invitation declined.');

      setNotifications((prev) =>
        prev.filter((n) => !(n.workspace_id === workspaceId && n.type === 'member_invited'))
      );

      setSelectedNotification(null);
      await refreshWorkspaces();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to decline invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      logger.error('Error marking all read:', err);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteAllNotifications = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications deleted');
    } catch (err) {
      logger.error('Error deleting notifications:', err);
      toast.error('Failed to delete notifications');
    }
  };

  return (
    <>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 border border-meetiq-border/50 bg-white text-muted-foreground hover:bg-slate-50 focus-visible:outline-none"
            />
          }
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount}
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 p-0" align="end" sideOffset={14}>
          <div className="flex items-center justify-between p-3">
            <span className="text-sm font-semibold font-heading text-primary">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-accent hover:underline font-medium"
                >
                  Mark all as read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={deleteAllNotifications}
                  className="text-xs text-destructive hover:underline font-medium flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete all
                </button>
              )}
            </div>
          </div>
          <Separator />
          
          <div className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground">
                <Bell className="h-8 w-8 mb-2 opacity-30" />
                <span>No notifications yet.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-left p-3 hover:bg-slate-50 transition-colors flex flex-col gap-1 ${!notif.read ? 'bg-blue-50/20' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-xs font-semibold ${!notif.read ? 'text-primary' : 'text-slate-700'}`}>
                        {notif.title}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {notif.message && (
                      <span className="text-xs text-muted-foreground line-clamp-2">
                        {notif.message}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <NotificationDetailDialog
        notification={selectedNotification}
        actionLoading={actionLoading}
        onClose={() => setSelectedNotification(null)}
        onAccept={handleAcceptInvite}
        onDecline={handleDeclineInvite}
      />
    </>
  );
}
