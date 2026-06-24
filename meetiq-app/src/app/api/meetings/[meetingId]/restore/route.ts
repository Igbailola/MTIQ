import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{
    meetingId: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { meetingId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: meeting } = await supabase
      .from('meetings')
      .select('workspace_id, title, uploaded_by')
      .eq('id', meetingId)
      .maybeSingle();

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', meeting.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle();

    const isUploader = meeting.uploaded_by === user.id;
    const isAdmin = member?.role === 'admin';

    if (!isUploader && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only the uploader or an admin can restore this meeting' }, { status: 403 });
    }

    const { error: restoreError } = await supabase
      .from('meetings')
      .update({ deleted_at: null })
      .eq('id', meetingId);

    if (restoreError) {
      return NextResponse.json({ error: restoreError.message }, { status: 500 });
    }

    await supabase.from('activity_feed').insert({
      workspace_id: meeting.workspace_id,
      actor_id: user.id,
      action: 'meeting_restored',
      entity_type: 'meeting',
      entity_id: meetingId,
      details: { title: meeting.title },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    logger.error('Error restoring meeting:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
