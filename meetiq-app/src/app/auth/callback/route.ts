import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send';
import { WelcomeEmail } from '@/lib/email/templates/welcome';

/**
 * Auth callback handler.
 * Exchanges the authorization code for a session or detects an existing session,
 * handles invite acceptance, and redirects accordingly.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const acceptInvite = searchParams.get('accept_invite');

  const supabase = await createClient();
  let user = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      user = data.user;
    }
  } else {
    // Already authenticated — check session (covers invite link clicked while logged in)
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      user = data.user;
    }
  }

  if (user) {
    // Accept workspace invite if an accept_invite param is present
    if (acceptInvite) {
      const firstUpdate = await supabase
        .from('workspace_members')
        .update({ status: 'active' })
        .eq('user_id', user.id)
        .eq('workspace_id', acceptInvite)
        .eq('status', 'pending');

      let acceptError = firstUpdate.error;

      if (firstUpdate.error && (firstUpdate.error.message?.includes('status') || firstUpdate.error.code === 'PGRST100')) {
        // Fallback: status column doesn't exist. Let's check if the user exists in workspace_members.
        const { data: exists } = await supabase
          .from('workspace_members')
          .select('*')
          .eq('user_id', user.id)
          .eq('workspace_id', acceptInvite)
          .maybeSingle();

        if (!exists) {
          const { error: insertErr } = await supabase
            .from('workspace_members')
            .insert({
              user_id: user.id,
              workspace_id: acceptInvite,
              role: 'member'
            });
          acceptError = insertErr;
        } else {
          acceptError = null; // Already exists, so accept is successful
        }
      }

      if (!acceptError) {
        // Update the invite notification to reflect acceptance
        await supabase
          .from('notifications')
          .update({ type: 'member_accepted', title: 'Workspace Joined', message: 'You have joined the workspace.' })
          .eq('user_id', user.id)
          .eq('workspace_id', acceptInvite)
          .eq('type', 'member_invited');
      }
    }

    // Check if this is a first-time user
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed, display_name')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !profile.onboarding_completed) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://meetiq-seven.vercel.app';
      sendEmail({
        to: user.email!,
        subject: 'Welcome to MeetIQ — Turn Meetings into Action',
        react: WelcomeEmail({
          displayName: profile?.display_name || user.user_metadata?.full_name || null,
          dashboardUrl: `${appUrl}/dashboard`,
        }),
      }).catch(() => {
        // Silently ignore — welcome email is not critical
      });

      const onboardingNext = acceptInvite ? `?next=${encodeURIComponent(`/auth/callback?accept_invite=${acceptInvite}`)}` : '';
      return NextResponse.redirect(`${origin}/onboarding${onboardingNext}`);
    }

    let finalNext = next;
    if (finalNext.startsWith('/auth/callback')) {
      finalNext = '/dashboard';
    }
    if (acceptInvite) {
      finalNext = `/dashboard?accepted=${acceptInvite}`;
    }
    return NextResponse.redirect(`${origin}${finalNext}`);
  }

  // Auth failed or no session — redirect to login, preserving accept_invite callback
  const callbackUrl = acceptInvite ? `/auth/callback?accept_invite=${acceptInvite}` : '/dashboard';
  return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent(callbackUrl)}`);
}

