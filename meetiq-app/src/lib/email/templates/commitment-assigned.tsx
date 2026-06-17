import { Text, Button, Section } from 'react-email';
import * as React from 'react';
import { EmailLayout } from './email-layout';

/**
 * Email sent to a user when they are assigned a commitment after publishing.
 */

interface CommitmentAssignedEmailProps {
  commitmentTitle: string;
  meetingTitle: string;
  assignerName: string;
  dueDate?: string | null;
  commitmentUrl: string;
}

export function CommitmentAssignedEmail({
  commitmentTitle,
  meetingTitle,
  assignerName,
  dueDate,
  commitmentUrl,
}: CommitmentAssignedEmailProps) {
  return (
    <EmailLayout previewText={`New commitment assigned: ${commitmentTitle}`}>
      <Text style={heading}>New Commitment Assigned</Text>
      <Text style={paragraph}>
        <strong>{assignerName}</strong> has assigned you a commitment from the meeting <strong>&quot;{meetingTitle}&quot;</strong>.
      </Text>

      <Section style={card}>
        <Text style={cardTitle}>{commitmentTitle}</Text>
        {dueDate && (
          <Text style={cardMeta}>
            📅 Due: <strong>{dueDate}</strong>
          </Text>
        )}
        <Text style={cardMeta}>
          📋 From: {meetingTitle}
        </Text>
      </Section>

      <Text style={paragraph}>
        Please review and confirm this commitment. You can accept, reject, or request changes.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={commitmentUrl}>
          View Commitment
        </Button>
      </Section>
    </EmailLayout>
  );
}

// ── Styles ──

const heading: React.CSSProperties = {
  color: 'hsl(222, 47%, 11%)',
  fontSize: '20px',
  fontWeight: 700,
  margin: '0 0 16px',
  letterSpacing: '-0.01em',
};

const paragraph: React.CSSProperties = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 16px',
};

const card: React.CSSProperties = {
  backgroundColor: 'hsl(214, 100%, 97%)',
  border: '1px solid hsl(217, 91%, 80%)',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 20px',
};

const cardTitle: React.CSSProperties = {
  color: 'hsl(222, 47%, 11%)',
  fontSize: '16px',
  fontWeight: 600,
  margin: '0 0 8px',
};

const cardMeta: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 4px',
};

const buttonContainer: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '24px 0 0',
};

const button: React.CSSProperties = {
  backgroundColor: 'hsl(217, 91%, 60%)',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 600,
  padding: '12px 28px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};
