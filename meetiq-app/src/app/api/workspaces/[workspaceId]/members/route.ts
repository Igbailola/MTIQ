import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { InviteMemberSchema } from '@/lib/schemas';
import { sendEmail } from '@/lib/email/send';
import { WorkspaceInviteEmail } from '@/lib/email/templates/workspace-invite';

import { logger } from '@/lib/logger';

/**
 * GET /api/workspaces/[workspaceId]/members - List workspace members
 * POST /api/workspaces/[workspaceId]/members - Invite/add member (admin only)
 * DELETE /api/workspaces/[workspaceId]/members - Remove member (admin only)
 */

interface RouteParams {
  params: Promise<{
    workspaceId: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch members of this workspace
    const { data: members, error: membersError } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    if (!members || members.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Fetch profiles for these members
    const userIds = members.map((m) => m.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    // Merge members and profiles
    const mergedMembers = members.map((member) => {
      const profile = profiles?.find((p) => p.id === member.user_id) || null;
      return {
        ...member,
        profile,
      };
    });

    return NextResponse.json(mergedMembers, { status: 200 });
  } catch (err) {
    logger.error('Error fetching members:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the current user is an admin in this workspace
    const { data: currentMember, error: currentMemberError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (currentMemberError || currentMember?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
    }

    // Check if the workspace exists and get its name
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', workspaceId)
      .maybeSingle();

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Validate body
    const body = await request.json();
    const result = InviteMemberSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    const { email, role, sendEmail: shouldSendEmail } = result.data;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL || 'localhost:3000'}`;
    
    let invitedUser = null;

    // Check if user already exists first
    const { data: usersData, error: usersError } = await adminSupabase.auth.admin.listUsers();
    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    const foundUser = usersData.users.find((u: { id: string; email?: string }) => u.email?.toLowerCase() === email.toLowerCase());

    if (foundUser) {
      // User is already registered in the app — use their existing user object
      invitedUser = foundUser;
    } else {
      // User does not exist, proceed with creation/invite
      if (shouldSendEmail === false) {
        const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
          email,
          email_confirm: true,
        });
        if (createError) {
          return NextResponse.json({ error: createError.message }, { status: 500 });
        }
        invitedUser = createData.user;
      } else {
        // Use admin client to invite/create user in Supabase auth
        const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${appUrl}/auth/callback?accept_invite=${workspaceId}`,
        });

        if (inviteError) {
          return NextResponse.json({ error: inviteError.message }, { status: 500 });
        }

        invitedUser = inviteData.user;
      }
    }

    if (!invitedUser) {
      return NextResponse.json({ error: 'Failed to invite user' }, { status: 500 });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', invitedUser.id)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 400 });
    }

    // Add to workspace members (pending until user accepts invite via callback)
    let member = null;
    let memberError = null;

    const firstTry = await adminSupabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: invitedUser.id,
        role,
        status: 'pending',
      })
      .select()
      .maybeSingle();

    if (firstTry.error && (firstTry.error.message?.includes('status') || firstTry.error.code === 'PGRST100')) {
      // Fallback: insert without status column
      const fallbackTry = await adminSupabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: invitedUser.id,
          role,
        })
        .select()
        .maybeSingle();
      member = fallbackTry.data;
      memberError = fallbackTry.error;
    } else {
      member = firstTry.data;
      memberError = firstTry.error;
    }

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    // Create a notification for the invited user
    await adminSupabase.from('notifications').insert({
      user_id: invitedUser.id,
      workspace_id: workspaceId,
      type: 'member_invited',
      title: 'Invited to Workspace',
      message: `You have been invited to join the workspace.`,
    });

    // Log in activity feed
    await adminSupabase.from('activity_feed').insert({
      workspace_id: workspaceId,
      actor_id: user.id,
      action: 'member_invited',
      entity_type: 'workspace',
      entity_id: workspaceId,
      details: { email, role },
    });

    // Send invitation email (fire-and-forget, don't block the API response)
    const inviterName = user.user_metadata?.full_name || user.email || 'A team member';
    const inviteLink = `${appUrl}/auth/callback?accept_invite=${workspaceId}`;

    sendEmail({
      to: email,
      subject: `You've been invited to join the "${workspace.name}" workspace on MeetIQ`,
      react: WorkspaceInviteEmail({
        workspaceName: workspace.name,
        inviterName,
        inviteUrl: inviteLink,
      }),
    }).catch((err) => {
      logger.error('Failed to send workspace invitation email:', err);
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    logger.error('Error inviting member:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const { searchParams } = new URL(request.url);
    const userIdToRemove = searchParams.get('userId');

    if (!userIdToRemove) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is admin in this workspace
    const { data: currentMember, error: currentMemberError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (currentMemberError || currentMember?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
    }

    // Can't remove yourself from here (must leave or delete workspace)
    if (userIdToRemove === user.id) {
      return NextResponse.json({ error: 'Cannot remove yourself. Use settings to leave workspace.' }, { status: 400 });
    }

    // Remove member
    const { error: deleteError } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userIdToRemove);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Log activity
    await supabase.from('activity_feed').insert({
      workspace_id: workspaceId,
      actor_id: user.id,
      action: 'member_removed',
      entity_type: 'workspace',
      entity_id: workspaceId,
      details: { removed_user_id: userIdToRemove },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    logger.error('Error removing member:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
