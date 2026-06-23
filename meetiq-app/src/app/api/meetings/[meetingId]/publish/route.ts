import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { CommitmentAssignedEmail } from '@/lib/email/templates/commitment-assigned';

import { logger } from '@/lib/logger';

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
      .maybeSingle();

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

    const adminSupabase = createAdminClient();

    // Get current user's profile for assigner name
    const { data: assignerProfile } = await adminSupabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();

    const assignerName = assignerProfile?.display_name || user.email || 'A team member';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://meetiq-seven.vercel.app';

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
        logger.error('Error updating commitment:', updateError);
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

        // Send email to the assigned owner
        const { data: ownerAuth } = await adminSupabase.auth.admin.getUserById(targetOwner);
        if (ownerAuth?.user?.email) {
          const dueDate = commitment.due_date
            ? new Date(commitment.due_date).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : null;

          sendEmail({
            to: ownerAuth.user.email,
            subject: `New commitment assigned: "${commitment.title}"`,
            react: CommitmentAssignedEmail({
              commitmentTitle: commitment.title,
              meetingTitle: meeting.title,
              assignerName,
              dueDate,
              commitmentUrl: `${appUrl}/commitments/${commitment.id}`,
            }),
          }).catch(() => {});
        }
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
  } catch (err: unknown) {
    logger.error('Error publishing commitments:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'An error occurred' }, { status: 500 });
  }
}

