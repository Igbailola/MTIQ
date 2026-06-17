import { Resend } from 'resend';

/**
 * Resend email client singleton.
 * Uses RESEND_API_KEY from environment variables.
 * Only initialised on the server side (API routes, Server Actions).
 */

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY is not set. Email sending is disabled.'
      );
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}
