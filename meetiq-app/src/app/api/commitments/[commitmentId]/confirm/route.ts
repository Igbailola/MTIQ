import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { CommitmentConfirmWithValidation } from '@/lib/schemas';
import { sendEmail } from '@/lib/email/send';
import { CommitmentConfirmedEmail } from '@/lib/email/templates/commitment-confirmed';

/**
 * POST /api/commitments/[commitmentId]/confirm - Accept, Reject, or Request Changes on a commitment
 */

interface RouteParams {
  params: Promise<{
    commitmentId: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { commitmentId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch commitment to check permissions
    const { data: commitment, error: fetchError } = await supabase
      .from('commitments')
      .select('*, meeting:meetings(workspace_id)')
      .eq('id', commitmentId)
      .single();

    if (fetchError || !commitment) {
      return NextResponse.json({ error: 'Commitment not found' }, { status: 404 });
    }

    // User can only confirm if they are the assigned owner
    if (commitment.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You are not the owner of this commitment' }, { status: 403 });
    }

    // Validate body
    const body = await request.json();
    const result = CommitmentConfirmWithValidation.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    const { action, reason } = result.data;
    const adminSupabase = createAdminClient();
    const now = new Date().toISOString();

    let updatedStatus = commitment.status;
    let confirmedAt = commitment.confirmed_at;

    if (action === 'accept') {
      updatedStatus = 'in_progress';
      confirmedAt = now;
    }

    // Update commitment
    const { data: updated, error: updateError } = await adminSupabase
      .from('commitments')
      .update({
        status: updatedStatus,
        confirmed_at: confirmedAt,
      })
      .eq('id', commitmentId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Create history entry
    await adminSupabase.from('commitment_history').insert({
      commitment_id: commitmentId,
      changed_by: user.id,
      field_changed: 'confirmation_action',
      old_value: commitment.status,
      new_value: `${action.toUpperCase()}${reason ? `: ${reason}` : ''}`,
    });

    const workspaceId = (commitment.meeting as any).workspace_id;

    // Send notification to the assigner
    if (commitment.assigner_id) {
      const actionLabels = {
        accept: 'accepted',
        reject: 'rejected',
        request_changes: 'requested changes on',
      };

      await adminSupabase.from('notifications').insert({
        user_id: commitment.assigner_id,
        workspace_id: workspaceId,
        type: `commitment_${action}`,
        title: `Commitment ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        message: `${user.email} has ${actionLabels[action]} the commitment: "${commitment.title}"${reason ? ` (Reason: "${reason}")` : ''}`,
        entity_type: 'commitment',
        entity_id: commitmentId,
      });

      // Send email to the assigner
      const { data: assignerAuth } = await adminSupabase.auth.admin.getUserById(commitment.assigner_id);
      if (assignerAuth?.user?.email) {
        // Get the owner's display name for the email
        const { data: ownerProfile } = await adminSupabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        const ownerName = ownerProfile?.display_name || user.email || 'A team member';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://meetiq-seven.vercel.app';

        sendEmail({
          to: assignerAuth.user.email,
          subject: `Commitment ${actionLabels[action]}: "${commitment.title}"`,
          react: CommitmentConfirmedEmail({
            commitmentTitle: commitment.title,
            ownerName,
            action: actionLabels[action] as 'accepted' | 'rejected' | 'requested changes on',
            reason: reason || null,
            commitmentUrl: `${appUrl}/commitments/${commitmentId}`,
          }),
        }).catch(() => {});
      }
    }

    // Log in activity feed
    await adminSupabase.from('activity_feed').insert({
      workspace_id: workspaceId,
      actor_id: user.id,
      action: `commitment_${action}ed` as any, // commitment_accepted, commitment_rejected, commitment_changes_requested
      entity_type: 'commitment',
      entity_id: commitmentId,
      details: {
        title: commitment.title,
        reason: reason || null,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error('Error confirming commitment:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

