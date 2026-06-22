'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Loader2, Trash2, Calendar, ArrowRight, Mail, Check, X, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import type { Notification } from '@/types/database';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

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
        console.error('Error fetching notifications:', err);
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
        (payload: any) => {
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
        console.error('Error marking notification as read:', err);
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

      await supabase.from('notifications').insert({
        user_id: user.id,
        workspace_id: workspaceId,
        type: 'member_accepted',
        title: 'Workspace Joined',
        message: 'You have joined the workspace.',
      }).catch(() => {});

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
    } catch (e: any) {
      toast.error(e.message || 'Failed to join workspace');
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
    } catch (e: any) {
      toast.error(e.message || 'Failed to decline invitation');
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
      console.error('Error marking all read:', err);
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
      console.error('Error deleting notifications:', err);
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

      <Dialog open={selectedNotification !== null} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <DialogContent className="sm:max-w-md p-9">
          {selectedNotification && (
            <>
              <DialogHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={selectedNotification.read ? "secondary" : "default"} className="text-[10px] font-semibold tracking-wider uppercase">
                    {selectedNotification.read ? "Read" : "Unread"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(selectedNotification.created_at), { addSuffix: true })}
                  </span>
                </div>
                <DialogTitle className="font-heading text-lg font-bold text-primary flex items-start gap-2">
                  <Info className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                  <span>{selectedNotification.title}</span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="py-4 space-y-4">
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.message}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Received: {format(new Date(selectedNotification.created_at), 'PPP p')}</span>
                </div>
              </div>

              <DialogFooter className="bg-transparent border-t-0 p-0 m-0 rounded-none sm:justify-end gap-2 pt-2">
                {selectedNotification.type === 'member_invited' && selectedNotification.workspace_id ? (
                  <div className="flex w-full gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleDeclineInvite(selectedNotification.workspace_id!)}
                      disabled={actionLoading}
                      className="flex-1 h-11 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-1.5" />
                          Decline
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleAcceptInvite(selectedNotification.workspace_id!)}
                      disabled={actionLoading}
                      className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1.5" />
                          Accept
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedNotification(null)}
                      className="h-11 px-6 text-sm"
                    >
                      Close
                    </Button>
                    {selectedNotification.entity_id && (
                      <Button
                        onClick={() => {
                          const notif = selectedNotification;
                          setSelectedNotification(null);
                          if (notif.entity_type === 'commitment') {
                            router.push(`/commitments/${notif.entity_id}`);
                          } else if (notif.entity_type === 'meeting') {
                            router.push(`/meetings/${notif.entity_id}`);
                          } else if (notif.entity_type === 'workspace') {
                            router.push(`/team`);
                          }
                        }}
                        className="h-11 px-5 text-sm gap-2"
                      >
                        <span>View Details</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
