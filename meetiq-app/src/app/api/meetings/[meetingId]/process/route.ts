import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { processMeetingWithAI } from '@/lib/ai/service';

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      try {
        const edgeResponse = await fetch(`${supabaseUrl}/functions/v1/ai-processor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ meeting_id: meetingId }),
        });

        if (edgeResponse.ok) {
          const data = await edgeResponse.json();
          return NextResponse.json(data, { status: 200 });
        }
      } catch {
        // Edge Function unavailable, fall through to local processing
      }
    }

    const adminSupabase = createAdminClient();

    const { data: meeting, error: meetingError } = await adminSupabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .maybeSingle();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    await adminSupabase
      .from('meetings')
      .update({ status: 'processing' })
      .eq('id', meetingId);

    const { data: members } = await adminSupabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', meeting.workspace_id);

    const userIds = (members || []).map((m) => m.user_id);
    const { data: profiles } = await adminSupabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);

    const result = await processMeetingWithAI(
      adminSupabase,
      meetingId,
      user.id,
      meeting.workspace_id,
      meeting.title,
      meeting.meeting_date,
      meeting.raw_text || '',
      profiles || []
    );

    return NextResponse.json({ success: true, commitmentsCount: result.commitments.length }, { status: 200 });
  } catch (err: unknown) {
    logger.error('Error during AI processing:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'AI processing failed' }, { status: 500 });
  }
}
