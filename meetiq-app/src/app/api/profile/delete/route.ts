import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function DELETE() {
  try {
    const supabase = await createClient();
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 2. Fetch all workspaces owned by the user
    const { data: ownedWorkspaces, error: workspacesError } = await admin
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id);

    if (workspacesError) {
      return NextResponse.json({ error: workspacesError.message }, { status: 500 });
    }

    // 3. Delete owned workspaces (this will cascade to meetings, commitments, decisions, members, feed, etc. on database level)
    if (ownedWorkspaces && ownedWorkspaces.length > 0) {
      const wsIds = ownedWorkspaces.map((w) => w.id);
      const { error: deleteWsError } = await admin
        .from('workspaces')
        .delete()
        .in('id', wsIds);

      if (deleteWsError) {
        return NextResponse.json({ error: deleteWsError.message }, { status: 500 });
      }
    }

    // 4. Delete user's memberships in other workspaces
    const { error: memberError } = await admin
      .from('workspace_members')
      .delete()
      .eq('user_id', user.id);

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    // 5. Delete user's notifications
    await admin.from('notifications').delete().eq('user_id', user.id);

    // 6. Clean up other table references where RLS or cascades might not automatically trigger
    // Delete user activity feed logs
    await admin.from('activity_feed').delete().eq('actor_id', user.id);

    // Delete commitment history logs
    await admin.from('commitment_history').delete().eq('changed_by', user.id);

    // Dissociate commitments owned or assigned by this user (set to NULL so they remain in respective workspaces)
    await admin.from('commitments').update({ owner_id: null }).eq('owner_id', user.id);
    await admin.from('commitments').update({ assigner_id: null }).eq('assigner_id', user.id);

    // Dissociate meetings uploaded by this user (set to NULL)
    await admin.from('meetings').update({ uploaded_by: null }).eq('uploaded_by', user.id);

    // 7. Delete the user's profile
    const { error: profileError } = await admin
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 8. Delete user from Supabase Auth
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      return NextResponse.json({ error: deleteUserError.message }, { status: 500 });
    }

    // Clean cookies by calling signout on server-side supabase client (optional but good practice)
    await supabase.auth.signOut();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Error deleting account:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
