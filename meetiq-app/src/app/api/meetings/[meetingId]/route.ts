import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MeetingUpdateSchema } from '@/lib/schemas';

import { logger } from '@/lib/logger';

/**
 * GET /api/meetings/[meetingId] - Fetch single meeting with decisions and commitments
 * PATCH /api/meetings/[meetingId] - Update meeting summary / details
 * DELETE /api/meetings/[meetingId] - Delete meeting (admin only)
 */

interface RouteParams {
  params: Promise<{
    meetingId: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { meetingId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch meeting details
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .maybeSingle();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Verify workspace membership
    const { data: getMember } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', meeting.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!getMember) {
      return NextResponse.json({ error: 'Forbidden: Not a workspace member' }, { status: 403 });
    }

    // Fetch decisions
    const { data: decisions, error: decisionsError } = await supabase
      .from('decisions')
      .select('*')
      .eq('meeting_id', meetingId);

    // Fetch commitments
    const { data: commitments, error: commitmentsError } = await supabase
      .from('commitments')
      .select('*')
      .eq('meeting_id', meetingId);

    // Fetch uploader profile
    const { data: uploader } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', meeting.uploaded_by)
      .maybeSingle();

    return NextResponse.json(
      {
        ...meeting,
        uploader,
        decisions: decisions || [],
        commitments: commitments || [],
      },
      { status: 200 }
    );
  } catch (err) {
    logger.error('Error fetching meeting details:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { meetingId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch meeting to verify membership
    const { data: patchMeeting } = await supabase
      .from('meetings')
      .select('workspace_id')
      .eq('id', meetingId)
      .maybeSingle();
    if (!patchMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const { data: patchMember } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', patchMeeting.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!patchMember) {
      return NextResponse.json({ error: 'Forbidden: Not a workspace member' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = MeetingUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Update meeting details (like summary)
    const { data: meeting, error: updateError } = await supabase
      .from('meetings')
      .update(validationResult.data)
      .eq('id', meetingId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(meeting, { status: 200 });
  } catch (err) {
    logger.error('Error updating meeting:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { meetingId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the meeting first to check workspace ID
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('workspace_id, title, uploaded_by')
      .eq('id', meetingId)
      .maybeSingle();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Allow the uploader or an admin to soft-delete
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', meeting.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle();

    const isUploader = meeting.uploaded_by === user.id;
    const isAdmin = member?.role === 'admin';

    if (!isUploader && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only the uploader or an admin can delete this meeting' }, { status: 403 });
    }

    // Soft-delete: set deleted_at timestamp
    const { error: deleteError } = await supabase
      .from('meetings')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', meetingId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Log in activity feed
    await supabase.from('activity_feed').insert({
      workspace_id: meeting.workspace_id,
      actor_id: user.id,
      action: 'meeting_deleted',
      entity_type: 'meeting',
      entity_id: meetingId,
      details: { title: meeting.title },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    logger.error('Error deleting meeting:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
