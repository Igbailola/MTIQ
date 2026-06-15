import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/meetings/[meetingId]/publish - Publish commitments, assign owners, and send notifications
 */

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

    // Fetch meeting details to check workspace ID
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('workspace_id, title')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Fetch unpublished commitments
    const { data: commitments, error: fetchError } = await supabase
      .from('commitments')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('published', false);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!commitments || commitments.length === 0) {
      return NextResponse.json({ error: 'No unpublished commitments found' }, { status: 400 });
    }

    const adminSupabase = await createAdminClient();

    // Publish all commitments and map suggested owner to owner_id
    for (const commitment of commitments) {
      const targetOwner = commitment.ai_owner_suggestion || null;

      // Update commitment: published = true, owner_id = suggested owner, assigner_id = current user
      const { error: updateError } = await adminSupabase
        .from('commitments')
        .update({
          published: true,
          owner_id: targetOwner,
          assigner_id: user.id,
          status: 'pending_confirmation',
        })
        .eq('id', commitment.id);

      if (updateError) {
        console.error('Error updating commitment:', updateError);
        continue;
      }

      // Notify owner if suggested owner exists
      if (targetOwner) {
        await adminSupabase.from('notifications').insert({
          user_id: targetOwner,
          workspace_id: meeting.workspace_id,
          type: 'commitment_assigned',
          title: 'New Commitment Assigned',
          message: `You have been suggested as owner for: "${commitment.title}"`,
          entity_type: 'commitment',
          entity_id: commitment.id,
        });
      }

      // Log in activity feed
      await adminSupabase.from('activity_feed').insert({
        workspace_id: meeting.workspace_id,
        actor_id: user.id,
        action: 'commitment_created',
        entity_type: 'commitment',
        entity_id: commitment.id,
        details: {
          title: commitment.title,
          owner_id: targetOwner,
        },
      });
    }

    return NextResponse.json({ success: true, count: commitments.length }, { status: 200 });
  } catch (err: any) {
    console.error('Error publishing commitments:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
