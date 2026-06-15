import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/commitments/escalate - Scan and process overdue commitments and escalate 48h unconfirmed commitments
 * Typically triggered by cron job. Bypasses standard RLS using admin client.
 */

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    // Basic protection check: only allow cron or authorized trigger
    // For MVP, we can check if it matches service role or a specific secret, or allow manual trigger for testing
    
    const adminSupabase = await createAdminClient();
    const now = new Date().toISOString();
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    let escalatedCount = 0;
    let overdueCount = 0;

    // ── 1. Escalation Scan (Unconfirmed for > 48h) ──
    const { data: unconfirmed, error: unconfirmedError } = await adminSupabase
      .from('commitments')
      .select('*, meeting:meetings(workspace_id)')
      .eq('status', 'pending_confirmation')
      .lt('created_at', fortyEightHoursAgo);

    if (unconfirmedError) {
      throw unconfirmedError;
    }

    for (const comm of unconfirmed || []) {
      const workspaceId = (comm.meeting as any).workspace_id;
      
      // Get workspace admins to notify
      const { data: admins } = await adminSupabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspaceId)
        .eq('role', 'admin');

      for (const admin of admins || []) {
        await adminSupabase.from('notifications').insert({
          user_id: admin.user_id,
          workspace_id: workspaceId,
          type: 'escalation',
          title: 'Unconfirmed Commitment Escalated',
          message: `The commitment "${comm.title}" has been unconfirmed for over 48 hours.`,
          entity_type: 'commitment',
          entity_id: comm.id,
        });
      }

      escalatedCount++;
    }

    // ── 2. Overdue Scan (Due date passed and status not completed) ──
    const { data: overdue, error: overdueError } = await adminSupabase
      .from('commitments')
      .select('*, meeting:meetings(workspace_id)')
      .not('status', 'eq', 'completed')
      .not('status', 'eq', 'overdue')
      .lt('due_date', now);

    if (overdueError) {
      throw overdueError;
    }

    for (const comm of overdue || []) {
      const workspaceId = (comm.meeting as any).workspace_id;

      // Update status to overdue
      await adminSupabase
        .from('commitments')
        .update({ status: 'overdue' })
        .eq('id', comm.id);

      // Create history entry
      await adminSupabase.from('commitment_history').insert({
        commitment_id: comm.id,
        changed_by: comm.owner_id || comm.assigner_id || null,
        field_changed: 'status',
        old_value: comm.status,
        new_value: 'overdue',
      });

      // Notify owner
      if (comm.owner_id) {
        await adminSupabase.from('notifications').insert({
          user_id: comm.owner_id,
          workspace_id: workspaceId,
          type: 'commitment_overdue',
          title: 'Commitment Overdue',
          message: `Your commitment "${comm.title}" is overdue.`,
          entity_type: 'commitment',
          entity_id: comm.id,
        });
      }

      // Notify assigner
      if (comm.assigner_id && comm.assigner_id !== comm.owner_id) {
        await adminSupabase.from('notifications').insert({
          user_id: comm.assigner_id,
          workspace_id: workspaceId,
          type: 'commitment_overdue',
          title: 'Commitment Overdue',
          message: `The commitment "${comm.title}" assigned to owner is overdue.`,
          entity_type: 'commitment',
          entity_id: comm.id,
        });
      }

      // Log in activity feed
      await adminSupabase.from('activity_feed').insert({
        workspace_id: workspaceId,
        action: 'commitment_status_changed',
        entity_type: 'commitment',
        entity_id: comm.id,
        details: {
          title: comm.title,
          old_status: comm.status,
          new_status: 'overdue',
        },
      });

      overdueCount++;
    }

    return NextResponse.json(
      {
        success: true,
        escalatedCount,
        overdueCount,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Error executing escalation scan:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
