import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase/with-auth';
import { MeetingUploadSchema } from '@/lib/schemas';

import { logger } from '@/lib/logger';

/**
 * GET /api/meetings?workspaceId=[id] - List meetings in workspace
 * POST /api/meetings - Create a meeting
 */

export const GET = withAuth(async ({ supabase, user, request }) => {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');

  if (!workspaceId) {
    return NextResponse.json({ error: 'Missing workspaceId parameter' }, { status: 400 });
  }

  const { data: meetings, error: meetingsError } = await supabase
    .from('meetings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('meeting_date', { ascending: false });

  if (meetingsError) {
    return NextResponse.json({ error: meetingsError.message }, { status: 500 });
  }

  return NextResponse.json(meetings || [], { status: 200 });
});

export const POST = withAuth(async ({ supabase, user, request }) => {
  const body = await request.json();
  const result = MeetingUploadSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.format() },
      { status: 400 }
    );
  }

  const { title, meeting_date, raw_text, workspace_id } = result.data;

  const { data: member, error: memberError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (memberError || !member) {
    return NextResponse.json({ error: 'Forbidden: Must be workspace member to upload meetings' }, { status: 403 });
  }

  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .insert({
      title,
      meeting_date,
      raw_text: raw_text || null,
      workspace_id,
      status: 'processing',
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (meetingError) {
    return NextResponse.json({ error: meetingError.message }, { status: 500 });
  }

  await supabase.from('activity_feed').insert({
    workspace_id,
    actor_id: user.id,
    action: 'meeting_uploaded',
    entity_type: 'meeting',
    entity_id: meeting.id,
    details: { title },
  });

  const origin = new URL(request.url).origin;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  fetch(`${origin}/api/meetings/${meeting.id}/process`, {
    method: 'POST',
    headers: {
      Cookie: request.headers.get('cookie') || '',
    },
    signal: controller.signal,
  })
    .then((res) => {
      if (!res.ok) {
        logger.error('Background process returned non-ok status:', res.status);
      }
    })
    .catch((err) => {
      if (err instanceof DOMException && err.name === 'AbortError') {
        logger.error('Background process timed out after 25s for meeting:', meeting.id);
      } else {
        logger.error('Error invoking process background api:', err);
      }
    })
    .finally(() => clearTimeout(timeoutId));

  return NextResponse.json(meeting, { status: 201 });
});
