import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CommitmentUpdateSchema } from '@/lib/schemas';
import { Profile } from '@/types/database';

import { logger } from '@/lib/logger';

/**
 * GET /api/commitments/[commitmentId] - Fetch single commitment details with history
 * PATCH /api/commitments/[commitmentId] - Update commitment (owner or admin)
 * DELETE /api/commitments/[commitmentId] - Delete commitment (admin only)
 */

interface RouteParams {
  params: Promise<{
    commitmentId: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { commitmentId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch commitment
    const { data: commitment, error: fetchError } = await supabase
      .from('commitments')
      .select('*, meeting:meetings(id, title, meeting_date, workspace_id)')
      .eq('id', commitmentId)
      .maybeSingle();

    if (fetchError || !commitment) {
      return NextResponse.json({ error: 'Commitment not found' }, { status: 404 });
    }

    // Verify workspace membership
    const getMeetingData = commitment.meeting as { workspace_id: string } | null;
    if (getMeetingData) {
      const { data: getMember } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', getMeetingData.workspace_id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!getMember) {
        return NextResponse.json({ error: 'Forbidden: Not a workspace member' }, { status: 403 });
      }
    }

    // Fetch history
    const { data: history, error: historyError } = await supabase
      .from('commitment_history')
      .select('*')
      .eq('commitment_id', commitmentId)
      .order('changed_at', { ascending: false });

    // Collect profile IDs (owner, assigner, history changers)
    const profileIds = new Set<string>();
    if (commitment.owner_id) profileIds.add(commitment.owner_id);
    if (commitment.assigner_id) profileIds.add(commitment.assigner_id);
    history?.forEach((h) => {
      if (h.changed_by) profileIds.add(h.changed_by);
    });

    // Fetch profiles
    const uniqueIds = Array.from(profileIds);
    let profiles: Profile[] = [];
    if (uniqueIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', uniqueIds);
      profiles = profilesData || [];
    }

    // Merge profiles
    const owner = profiles.find((p) => p.id === commitment.owner_id) || null;
    const assigner = profiles.find((p) => p.id === commitment.assigner_id) || null;
    
    const mergedHistory = (history || []).map((h) => {
      const changer = profiles.find((p) => p.id === h.changed_by) || null;
      return {
        ...h,
        changer,
      };
    });

    return NextResponse.json(
      {
        ...commitment,
        owner,
        assigner,
        history: mergedHistory,
      },
      { status: 200 }
    );
  } catch (err) {
    logger.error('Error fetching commitment details:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { commitmentId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch commitment to verify membership
    const { data: patchCmt } = await supabase
      .from('commitments')
      .select('meeting:meetings(workspace_id)')
      .eq('id', commitmentId)
      .maybeSingle();
    if (patchCmt) {
      const patchWs = patchCmt.meeting as { workspace_id: string } | null;
      if (patchWs) {
        const { data: patchMember } = await supabase
          .from('workspace_members')
          .select('role')
          .eq('workspace_id', patchWs.workspace_id)
          .eq('user_id', user.id)
          .maybeSingle();
        if (!patchMember) {
          return NextResponse.json({ error: 'Forbidden: Not a workspace member' }, { status: 403 });
        }
      }
    }

    // Validate body
    const body = await request.json();
    const result = CommitmentUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    // Update commitment details
    const { data: updated, error: updateError } = await supabase
      .from('commitments')
      .update(result.data)
      .eq('id', commitmentId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    logger.error('Error updating commitment:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { commitmentId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the commitment to check meeting/workspace
    const { data: commitment, error: fetchError } = await supabase
      .from('commitments')
      .select('title, meeting:meetings(workspace_id)')
      .eq('id', commitmentId)
      .maybeSingle();

    if (fetchError || !commitment) {
      return NextResponse.json({ error: 'Commitment not found' }, { status: 404 });
    }

    // Check if the current user is an admin in the workspace
    const workspaceId = (commitment.meeting as { workspace_id: string }).workspace_id;
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError || member?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
    }

    // Delete commitment
    const { error: deleteError } = await supabase
      .from('commitments')
      .delete()
      .eq('id', commitmentId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Log activity
    await supabase.from('activity_feed').insert({
      workspace_id: workspaceId,
      actor_id: user.id,
      action: 'commitment_deleted',
      entity_type: 'commitment',
      entity_id: commitmentId,
      details: { title: commitment.title },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    logger.error('Error deleting commitment:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
