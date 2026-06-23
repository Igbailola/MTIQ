'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Calendar, ArrowRight, Check, X, Loader2, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/types/database';
import { formatDistanceToNow, format } from 'date-fns';

interface NotificationDetailDialogProps {
  notification: Notification | null;
  actionLoading: boolean;
  onClose: () => void;
  onAccept: (workspaceId: string) => void;
  onDecline: (workspaceId: string) => void;
}

export function NotificationDetailDialog({
  notification,
  actionLoading,
  onClose,
  onAccept,
  onDecline,
}: NotificationDetailDialogProps) {
  const router = useRouter();

  return (
    <Dialog open={notification !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-9">
        {notification && (
          <>
            <DialogHeader className="pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={notification.read ? 'secondary' : 'default'} className="text-[10px] font-semibold tracking-wider uppercase">
                  {notification.read ? 'Read' : 'Unread'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
              </div>
              <DialogTitle className="font-heading text-lg font-bold text-primary flex items-start gap-2">
                <Info className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <span>{notification.title}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {notification.message}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                <span>Received: {format(new Date(notification.created_at), 'PPP p')}</span>
              </div>
            </div>

            <DialogFooter className="bg-transparent border-t-0 p-0 m-0 rounded-none sm:justify-end gap-2 pt-2">
              {notification.type === 'member_invited' && notification.workspace_id ? (
                <div className="flex w-full gap-3">
                  <Button
                    variant="outline"
                    onClick={() => onDecline(notification.workspace_id!)}
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
                    onClick={() => onAccept(notification.workspace_id!)}
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
                  <Button variant="outline" onClick={onClose} className="h-11 px-6 text-sm">
                    Close
                  </Button>
                  {notification.entity_id && (
                    <Button
                      onClick={() => {
                        const notif = notification;
                        onClose();
                        if (notif.entity_type === 'commitment') {
                          router.push(`/commitments/${notif.entity_id}`);
                        } else if (notif.entity_type === 'meeting') {
                          router.push(`/meetings/${notif.entity_id}`);
                        } else if (notif.entity_type === 'workspace') {
                          router.push('/team');
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
  );
}
