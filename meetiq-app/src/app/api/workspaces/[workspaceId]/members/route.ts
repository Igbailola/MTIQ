import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { InviteMemberSchema } from '@/lib/schemas';

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
    console.error('Error fetching members:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

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
      .single();

    if (currentMemberError || currentMember?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
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

    const { email, role } = result.data;

    // Use admin client to invite/create user in Supabase auth
    const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email);

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    const invitedUser = inviteData.user;
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

    // Add to workspace members
    const { data: member, error: memberError } = await adminSupabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: invitedUser.id,
        role,
      })
      .select()
      .single();

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

    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    console.error('Error inviting member:', err);
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
      .single();

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
    console.error('Error removing member:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
