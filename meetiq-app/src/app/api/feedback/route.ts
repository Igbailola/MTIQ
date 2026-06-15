import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AIFeedbackSchema } from '@/lib/schemas';

/**
 * POST /api/feedback - Save thumbs up/down feedback on AI outputs
 */

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate body
    const body = await request.json();
    const result = AIFeedbackSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    const { entity_type, entity_id, feedback, categories } = result.data;

    // Save feedback
    const { data, error } = await supabase
      .from('ai_feedback')
      .insert({
        entity_type,
        entity_id,
        user_id: user.id,
        feedback,
        categories: categories || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Error saving AI feedback:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
