import { Text, Button, Section } from 'react-email';
import * as React from 'react';
import { EmailLayout } from './email-layout';

/**
 * Welcome email sent to new users after registration (email/password or Google OAuth).
 */

interface WelcomeEmailProps {
  displayName?: string | null;
  dashboardUrl: string;
}

export function WelcomeEmail({
  displayName,
  dashboardUrl,
}: WelcomeEmailProps) {
  const greeting = displayName ? `Hi ${displayName}` : 'Hi there';

  return (
    <EmailLayout previewText="Welcome to MeetIQ — turn meetings into action">
      <Text style={heading}>{greeting} 👋</Text>
      <Text style={headingSub}>Welcome to MeetIQ!</Text>

      <Text style={paragraph}>
        You&apos;ve just joined the platform that turns meeting conversations into confirmed commitments with clear ownership and accountability.
      </Text>

      <Section style={featureList}>
        <Text style={featureItem}>
          📤 <strong>Upload meeting notes</strong> — paste text or upload TXT, DOCX, PDF files
        </Text>
        <Text style={featureItem}>
          🤖 <strong>AI-powered extraction</strong> — automatically identify decisions, commitments, and owners
        </Text>
        <Text style={featureItem}>
          ✅ <strong>Track accountability</strong> — owners confirm, update progress, and complete on time
        </Text>
        <Text style={featureItem}>
          📊 <strong>Dashboard visibility</strong> — see who committed to what, in real time
        </Text>
      </Section>

      <Text style={paragraph}>
        Get started by creating a workspace, inviting your team, and uploading your first meeting notes.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={dashboardUrl}>
          Go to Dashboard
        </Button>
      </Section>

      <Text style={smallText}>
        Need help? Reply to this email or check our docs.
      </Text>
    </EmailLayout>
  );
}

// ── Styles ──

const heading: React.CSSProperties = {
  color: 'hsl(222, 47%, 11%)',
  fontSize: '22px',
  fontWeight: 700,
  margin: '0 0 4px',
  letterSpacing: '-0.01em',
};

const headingSub: React.CSSProperties = {
  color: 'hsl(217, 91%, 60%)',
  fontSize: '18px',
  fontWeight: 600,
  margin: '0 0 20px',
};

const paragraph: React.CSSProperties = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 20px',
};

const featureList: React.CSSProperties = {
  backgroundColor: 'hsl(214, 100%, 97%)',
  border: '1px solid hsl(217, 91%, 80%)',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 20px',
};

const featureItem: React.CSSProperties = {
  color: '#374151',
  fontSize: '13px',
  lineHeight: '22px',
  margin: '0 0 8px',
};

const buttonContainer: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '24px 0 16px',
};

const button: React.CSSProperties = {
  backgroundColor: 'hsl(217, 91%, 60%)',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 600,
  padding: '12px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};

const smallText: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: 0,
};
