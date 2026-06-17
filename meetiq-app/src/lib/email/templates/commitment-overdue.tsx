import { Text, Button, Section } from 'react-email';
import * as React from 'react';
import { EmailLayout } from './email-layout';

/**
 * Email sent when a commitment becomes overdue (due date has passed).
 */

interface CommitmentOverdueEmailProps {
  commitmentTitle: string;
  dueDate: string;
  commitmentUrl: string;
}

export function CommitmentOverdueEmail({
  commitmentTitle,
  dueDate,
  commitmentUrl,
}: CommitmentOverdueEmailProps) {
  return (
    <EmailLayout previewText={`Overdue: ${commitmentTitle}`}>
      <Section style={alertBanner}>
        <Text style={alertText}>⚠️ Commitment Overdue</Text>
      </Section>

      <Text style={paragraph}>
        Your commitment has passed its due date and is now marked as <strong style={{ color: '#ef4444' }}>overdue</strong>.
      </Text>

      <Section style={card}>
        <Text style={cardTitle}>{commitmentTitle}</Text>
        <Text style={cardMeta}>
          📅 Due date: <strong style={{ color: '#ef4444' }}>{dueDate}</strong>
        </Text>
      </Section>

      <Text style={paragraph}>
        Please update the status or mark it as completed if finished. If you&apos;re blocked, update the status so your team knows.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={commitmentUrl}>
          Update Status
        </Button>
      </Section>
    </EmailLayout>
  );
}

// ── Styles ──

const alertBanner: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const alertText: React.CSSProperties = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: 700,
  margin: 0,
};

const paragraph: React.CSSProperties = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 16px',
};

const card: React.CSSProperties = {
  backgroundColor: '#fafafa',
  border: '1px solid #e5e7eb',
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
  margin: '0',
};

const buttonContainer: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '24px 0 0',
};

const button: React.CSSProperties = {
  backgroundColor: '#ef4444',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 600,
  padding: '12px 28px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};
