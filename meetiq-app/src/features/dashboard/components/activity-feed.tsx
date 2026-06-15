'use client';

import React, { useEffect, useState } from 'react';
import type { ActivityFeedItem, Profile } from '@/types/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Loader2 } from 'lucide-react';

interface ActivityFeedProps {
  initialActivities: (ActivityFeedItem & { actor: Profile | null })[];
  workspaceId: string;
}

export function ActivityFeed({ initialActivities, workspaceId }: ActivityFeedProps) {
  const supabase = createClient();
  const [activities, setActivities] = useState<(ActivityFeedItem & { actor: Profile | null })[]>(initialActivities);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActivities(initialActivities);
  }, [initialActivities]);

  // Subscribe to real-time updates on activity_feed for this workspace
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`workspace-activities-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        async (payload: any) => {
          const newActivity = payload.new as ActivityFeedItem;
          
          // Fetch the profile for the actor
          let actorProfile = null;
          if (newActivity.actor_id) {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newActivity.actor_id)
              .single();
            actorProfile = data;
          }

          const completeActivity = {
            ...newActivity,
            actor: actorProfile,
          };

          setActivities((prev) => [completeActivity, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getActionText = (action: string) => {
    const map: Record<string, string> = {
      commitment_created: 'created the draft commitment',
      commitment_confirmed: 'accepted the commitment',
      commitment_accepted: 'accepted the commitment',
      commitment_rejected: 'rejected the commitment',
      commitment_changes_requested: 'requested changes on the commitment',
      commitment_completed: 'completed the commitment',
      commitment_status_changed: 'updated status of',
      commitment_blocked: 'reported blocked on the commitment',
      meeting_uploaded: 'uploaded meeting notes',
      meeting_processed: 'processed AI results for meeting',
      member_invited: 'invited member',
      member_joined: 'joined the workspace',
    };
    return map[action] || action.replace('_', ' ');
  };

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-slate-50/50 font-body">
        <Activity className="h-8 w-8 mb-2 opacity-30" />
        <span>No activity reported in this workspace yet.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-body">
      <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto pr-2">
        {activities.map((item) => (
          <div key={item.id} className="py-3 flex items-start gap-3 first:pt-0 last:pb-0">
            <Avatar className="h-7 w-7 shrink-0 mt-0.5">
              <AvatarImage src={item.actor?.avatar_url || ''} />
              <AvatarFallback className="text-xs bg-slate-100 text-slate-700 font-bold">
                {item.actor?.display_name ? getInitials(item.actor.display_name) : 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5 min-w-0 flex-1">
              <p className="text-xs text-slate-600 leading-normal">
                <span className="font-semibold text-primary">
                  {item.actor?.display_name || 'System'}
                </span>{' '}
                {getActionText(item.action)}{' '}
                {(item.details as any)?.title && (
                  <span className="font-semibold text-slate-800">
                    &ldquo;{String((item.details as any).title)}&rdquo;
                  </span>
                )}
              </p>
              <span className="text-xs text-muted-foreground block">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
