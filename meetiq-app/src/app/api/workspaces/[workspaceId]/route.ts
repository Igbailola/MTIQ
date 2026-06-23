import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WorkspaceUpdateSchema } from '@/lib/schemas';

import { logger } from '@/lib/logger';

/**
 * GET /api/workspaces/[workspaceId] - Get workspace details
 * PATCH /api/workspaces/[workspaceId] - Update workspace settings (admin only)
 * DELETE /api/workspaces/[workspaceId] - Delete workspace (admin only)
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

    // Verify workspace membership
    const { data: getMember } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!getMember) {
      return NextResponse.json({ error: 'Forbidden: Not a workspace member' }, { status: 403 });
    }

    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .maybeSingle();

    if (workspaceError) {
      return NextResponse.json({ error: workspaceError.message }, { status: 404 });
    }

    return NextResponse.json(workspace, { status: 200 });
  } catch (err) {
    logger.error('Error fetching workspace:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role (JSDoc says "admin only")
    const { data: patchMember } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!patchMember || patchMember.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
    }

    // Validate body
    const body = await request.json();
    const result = WorkspaceUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    // Update workspace name
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .update({ name: result.data.name })
      .eq('id', workspaceId)
      .select()
      .single();

    if (workspaceError) {
      return NextResponse.json({ error: workspaceError.message }, { status: 403 });
    }

    return NextResponse.json(workspace, { status: 200 });
  } catch (err) {
    logger.error('Error updating workspace:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role (JSDoc says "admin only")
    const { data: delMember } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!delMember || delMember.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
    }

    const { error: workspaceError } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId);

    if (workspaceError) {
      return NextResponse.json({ error: workspaceError.message }, { status: 403 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    logger.error('Error deleting workspace:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
