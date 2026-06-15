import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subDays } from 'date-fns';

/**
 * GET /api/dashboard/stats?workspaceId=[id] - Retrieve workspace dashboard summary KPI stats
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId parameter' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify workspace membership
    const { data: memberCheck } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!memberCheck) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // 1. Fetch meetings this week (last 7 days)
    const sevenDaysAgo = subDays(new Date(), 7).toISOString().split('T')[0];
    const { count: meetingsCount, error: meetingsError } = await supabase
      .from('meetings')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('meeting_date', sevenDaysAgo);

    if (meetingsError) throw meetingsError;

    // 2. Fetch all commitments for the workspace (via inner join with meetings)
    const { data: commitments, error: commitmentsError } = await supabase
      .from('commitments')
      .select('id, status, owner_id, meetings!inner(workspace_id)')
      .eq('meetings.workspace_id', workspaceId);

    if (commitmentsError) throw commitmentsError;

    // Calculate totals and rates
    const totalCommitments = commitments?.length || 0;
    
    // Status breakdown counts
    const statusBreakdown = {
      pending_confirmation: 0,
      in_progress: 0,
      blocked: 0,
      completed: 0,
      overdue: 0,
    };

    commitments?.forEach((c) => {
      const status = c.status as keyof typeof statusBreakdown;
      if (status in statusBreakdown) {
        statusBreakdown[status]++;
      }
    });

    const totalConfirmed = totalCommitments - statusBreakdown.pending_confirmation;
    const confirmationRate = totalCommitments > 0 
      ? Math.round((totalConfirmed / totalCommitments) * 100) 
      : 0;

    const completionRate = totalConfirmed > 0 
      ? Math.round((statusBreakdown.completed / totalConfirmed) * 100) 
      : 0;

    // 3. Fetch workspace members profiles for per-member accountability table
    const { data: members } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId);

    const userIds = (members || []).map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds);

    // Aggregate statistics per member
    const teamMemberStats = (profiles || []).map((p) => {
      const memberCommitments = commitments?.filter((c) => c.owner_id === p.id) || [];
      const total = memberCommitments.length;
      const completed = memberCommitments.filter((c) => c.status === 'completed').length;
      const overdue = memberCommitments.filter((c) => c.status === 'overdue').length;
      const confirmed = memberCommitments.filter((c) => c.status !== 'pending_confirmation').length;

      return {
        user_id: p.id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        total_commitments: total,
        confirmed,
        completed,
        overdue,
      };
    });

    return NextResponse.json({
      totalMeetingsThisWeek: meetingsCount || 0,
      totalCommitments,
      confirmationRate,
      completionRate,
      statusBreakdown,
      teamMemberStats,
    }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching dashboard stats:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
