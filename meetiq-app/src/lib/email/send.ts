import { type ReactElement } from 'react';
import { getResendClient } from './client';

/**
 * Send an email using Resend.
 *
 * This is a fire-and-forget helper that NEVER throws —
 * email failures are logged but must not break the calling API route.
 */

interface SendEmailOptions {
  /** Recipient email address */
  to: string | string[];
  /** Email subject line */
  subject: string;
  /** React Email template component */
  react: ReactElement;
}

const DEFAULT_FROM = process.env.EMAIL_FROM || 'MeetIQ <onboarding@resend.dev>';

export async function sendEmail({ to, subject, react }: SendEmailOptions): Promise<boolean> {
  try {
    const resend = getResendClient();

    const { error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
    });

    if (error) {
      console.error('[Email] Failed to send:', { to, subject, error });
      return false;
    }

    console.log('[Email] Sent successfully:', { to, subject });
    return true;
  } catch (err) {
    // Never throw — email is not critical enough to break the flow
    console.error('[Email] Error sending email:', { to, subject, err });
    return false;
  }
}
