import { NextResponse } from 'next/server';
import { createClient } from './server';

type RouteHandler = (params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string };
  request: Request;
}) => Promise<Response>;

export function withAuth(handler: RouteHandler) {
  return async (request: Request) => {
    try {
      const supabase = await createClient();

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      return handler({ supabase, user: { id: user.id, email: user.email }, request });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
