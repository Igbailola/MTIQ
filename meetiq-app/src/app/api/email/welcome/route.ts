import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send';
import { WelcomeEmail } from '@/lib/email/templates/welcome';

import { logger } from '@/lib/logger';

/**
 * POST /api/email/welcome - Send a welcome email to a newly registered user.
 * Called from the registration flow (both email/password and Google OAuth).
 *
 * Body: { email: string, displayName?: string }
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, displayName } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://meetiq-seven.vercel.app';

    await sendEmail({
      to: email,
      subject: 'Welcome to MeetIQ — Turn Meetings into Action',
      react: WelcomeEmail({
        displayName: displayName || null,
        dashboardUrl: `${appUrl}/dashboard`,
      }),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    logger.error('Error sending welcome email:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
