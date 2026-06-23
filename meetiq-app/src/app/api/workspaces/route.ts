import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WorkspaceCreateSchema } from '@/lib/schemas';

import { logger } from '@/lib/logger';

/**
 * GET /api/workspaces - List user's workspaces
 * POST /api/workspaces - Create a new workspace
 */

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch workspace IDs for the user
    const { data: memberRows, error: memberError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id);

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    if (!memberRows || memberRows.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const workspaceIds = memberRows.map((r) => r.workspace_id);

    // Fetch workspace details
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .in('id', workspaceIds)
      .order('created_at', { ascending: false });

    if (workspaceError) {
      return NextResponse.json({ error: workspaceError.message }, { status: 500 });
    }

    return NextResponse.json(workspaces, { status: 200 });
  } catch (err) {
    logger.error('Error fetching workspaces:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate body
    const body = await request.json();
    const result = WorkspaceCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    // Insert new workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: result.data.name,
        owner_id: user.id,
      })
      .select()
      .single();

    if (workspaceError) {
      return NextResponse.json({ error: workspaceError.message }, { status: 500 });
    }

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'admin',
      });

    if (memberError) {
      // Cleanup workspace on member creation failure
      await supabase.from('workspaces').delete().eq('id', workspace.id);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json(workspace, { status: 201 });
  } catch (err) {
    logger.error('Error creating workspace:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
