import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MeetingUploadSchema } from '@/lib/schemas';

import { logger } from '@/lib/logger';

/**
 * GET /api/meetings?workspaceId=[id] - List meetings in workspace
 * POST /api/meetings - Create a meeting
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

    // RLS guidelines: meetings are workspace-scoped. We fetch meetings belonging to workspaceId
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('meeting_date', { ascending: false });

    if (meetingsError) {
      return NextResponse.json({ error: meetingsError.message }, { status: 500 });
    }

    return NextResponse.json(meetings || [], { status: 200 });
  } catch (err) {
    logger.error('Error fetching meetings:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate body
    const body = await request.json();
    const result = MeetingUploadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    const { title, meeting_date, raw_text, workspace_id } = result.data;

    // Check if user is a member of the workspace
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Forbidden: Must be workspace member to upload meetings' }, { status: 403 });
    }

    // Insert meeting
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        title,
        meeting_date,
        raw_text: raw_text || null,
        workspace_id,
        status: 'processing', // Start in processing state
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (meetingError) {
      return NextResponse.json({ error: meetingError.message }, { status: 500 });
    }

    // Log activity
    await supabase.from('activity_feed').insert({
      workspace_id,
      actor_id: user.id,
      action: 'meeting_uploaded',
      entity_type: 'meeting',
      entity_id: meeting.id,
      details: { title },
    });

    // Fire-and-forget: Trigger the processing API in background
    // We fetch our own endpoint or call the edge function directly
    const origin = new URL(request.url).origin;
    fetch(`${origin}/api/meetings/${meeting.id}/process`, {
      method: 'POST',
      headers: {
        // Pass auth header or cookie for session continuity
        Cookie: request.headers.get('cookie') || '',
      },
    }).catch((err) => {
      logger.error('Error invoking process background api:', err);
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (err) {
    logger.error('Error creating meeting:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
