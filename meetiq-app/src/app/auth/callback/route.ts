import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send';
import { WelcomeEmail } from '@/lib/email/templates/welcome';

/**
 * OAuth callback handler.
 * Exchanges the authorization code for a session and redirects to the requested path.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && user) {
      // Check if onboarding is completed
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, display_name')
        .eq('id', user.id)
        .single();

      // Send welcome email for first-time users (fire-and-forget)
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

        return NextResponse.redirect(`${origin}/workspace/create`);
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions if authentication fails
  return NextResponse.redirect(`${origin}/login?error=AuthCallbackError`);
}

