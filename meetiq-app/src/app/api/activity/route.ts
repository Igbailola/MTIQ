import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/activity?workspaceId=[id]&limit=[limit]&offset=[offset] - Get chronological activity feed for workspace
 * DELETE /api/activity?workspaceId=[id]&deleteAll=true - Delete all activity for a workspace
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId parameter' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch activity rows
    const { data: activities, error: activityError } = await supabase
      .from('activity_feed')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (activityError) {
      return NextResponse.json({ error: activityError.message }, { status: 500 });
    }

    if (!activities || activities.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Collect actor profiles
    const actorIds = Array.from(new Set(activities.map((a) => a.actor_id).filter(Boolean))) as string[];
    let profiles: any[] = [];
    if (actorIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', actorIds);
      profiles = profilesData || [];
    }

    // Merge actor profiles
    const mergedActivities = activities.map((activity) => {
      const actor = profiles.find((p) => p.id === activity.actor_id) || null;
      return {
        ...activity,
        actor,
      };
    });

    return NextResponse.json(mergedActivities, { status: 200 });
  } catch (err) {
    console.error('Error fetching activity feed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const deleteAll = searchParams.get('deleteAll');
    const id = searchParams.get('id');

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (id) {
      const { error } = await supabase
        .from('activity_feed')
        .delete()
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (!workspaceId || deleteAll !== 'true') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { error } = await supabase
      .from('activity_feed')
      .delete()
      .eq('workspace_id', workspaceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Error deleting activity feed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
