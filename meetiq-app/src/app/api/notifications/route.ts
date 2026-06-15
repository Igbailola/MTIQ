import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/notifications - List user's notifications
 * PATCH /api/notifications - Mark notifications as read
 */

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(notifications || [], { status: 200 });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    let query = supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id);

    if (notificationId) {
      query = query.eq('id', notificationId);
    } else {
      query = query.eq('read', false); // Mark all unread as read
    }

    const { data, error } = await query.select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updatedCount: data?.length || 0 }, { status: 200 });
  } catch (err) {
    console.error('Error updating notifications:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
