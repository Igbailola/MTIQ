import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CommitmentCreateSchema } from '@/lib/schemas';
import { Profile } from '@/types/database';

import { logger } from '@/lib/logger';

/**
 * GET /api/commitments?workspaceId=[id]&status=[status]&ownerId=[id] - List commitments
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status');
    const ownerId = searchParams.get('ownerId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId parameter' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Start building query
    let query = supabase
      .from('commitments')
      .select('*, meeting:meetings!inner(id, title, meeting_date, workspace_id)')
      .eq('meeting.workspace_id', workspaceId);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (ownerId && ownerId !== 'all') {
      query = query.eq('owner_id', ownerId);
    }

    const { data: commitments, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!commitments || commitments.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Collect profile IDs
    const profileIds = new Set<string>();
    commitments.forEach((c) => {
      if (c.owner_id) profileIds.add(c.owner_id);
      if (c.assigner_id) profileIds.add(c.assigner_id);
    });

    // Fetch profiles
    const uniqueIds = Array.from(profileIds);
    let profiles: Profile[] = [];
    if (uniqueIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', uniqueIds);
      profiles = profilesData || [];
    }

    // Merge profiles into commitments
    const mergedCommitments = commitments.map((c) => {
      const owner = profiles.find((p) => p.id === c.owner_id) || null;
      const assigner = profiles.find((p) => p.id === c.assigner_id) || null;
      return {
        ...c,
        owner,
        assigner,
      };
    });

    return NextResponse.json(mergedCommitments, { status: 200 });
  } catch (err) {
    logger.error('Error fetching commitments:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/commitments - Manually create a commitment
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = CommitmentCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    const { meeting_id, title, description, owner_id, due_date, priority } = result.data;

    // Fetch meeting to get its workspace_id
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('workspace_id, title')
      .eq('id', meeting_id)
      .maybeSingle();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Check user is workspace member
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', meeting.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Forbidden: you must be a member of this workspace' }, { status: 403 });
    }

    // Insert commitment
    const { data: commitment, error: insertError } = await supabase
      .from('commitments')
      .insert({
        meeting_id,
        title,
        description: description || null,
        owner_id: owner_id || null,
        due_date: due_date || null,
        priority,
        status: 'pending_confirmation',
        published: false, // Start as draft
        assigner_id: user.id, // Assigner is the admin who manually created it
        ai_confidence: 'high', // Admin created tasks are treated as high confidence
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Log Activity
    await supabase.from('activity_feed').insert({
      workspace_id: meeting.workspace_id,
      actor_id: user.id,
      action: 'commitment_created',
      entity_type: 'commitment',
      entity_id: commitment.id,
      details: { title: commitment.title, meeting_title: meeting.title },
    });

    return NextResponse.json(commitment, { status: 201 });
  } catch (err) {
    logger.error('Error creating commitment:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
