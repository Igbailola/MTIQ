import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WorkspaceUpdateSchema } from '@/lib/schemas';

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

    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (workspaceError) {
      return NextResponse.json({ error: workspaceError.message }, { status: 404 });
    }

    return NextResponse.json(workspace, { status: 200 });
  } catch (err) {
    console.error('Error fetching workspace:', err);
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
    console.error('Error updating workspace:', err);
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

    const { error: workspaceError } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId);

    if (workspaceError) {
      return NextResponse.json({ error: workspaceError.message }, { status: 403 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Error deleting workspace:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
