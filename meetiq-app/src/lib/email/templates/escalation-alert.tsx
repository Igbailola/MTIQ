import { Text, Button, Section } from 'react-email';
import * as React from 'react';
import { EmailLayout } from './email-layout';

/**
 * Email sent to workspace admins when a commitment remains unconfirmed for 48+ hours.
 */

interface EscalationAlertEmailProps {
  commitmentTitle: string;
  ownerName: string;
  hoursSinceCreation: number;
  commitmentUrl: string;
}

export function EscalationAlertEmail({
  commitmentTitle,
  ownerName,
  hoursSinceCreation,
  commitmentUrl,
}: EscalationAlertEmailProps) {
  return (
    <EmailLayout previewText={`Escalation: "${commitmentTitle}" unconfirmed for ${hoursSinceCreation}h`}>
      <Section style={alertBanner}>
        <Text style={alertText}>🚨 Escalation Alert</Text>
      </Section>

      <Text style={paragraph}>
        A commitment has been <strong>unconfirmed for over {hoursSinceCreation} hours</strong> and requires your attention as a workspace admin.
      </Text>

      <Section style={card}>
        <Text style={cardTitle}>{commitmentTitle}</Text>
        <Text style={cardMeta}>
          👤 Assigned to: <strong>{ownerName}</strong>
        </Text>
        <Text style={cardMeta}>
          ⏰ Unconfirmed for: <strong>{hoursSinceCreation}+ hours</strong>
        </Text>
      </Section>

      <Text style={paragraph}>
        Consider reaching out to <strong>{ownerName}</strong> directly, or reassign this commitment to another team member.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={commitmentUrl}>
          Review Commitment
        </Button>
      </Section>
    </EmailLayout>
  );
}

// ── Styles ──

const alertBanner: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const alertText: React.CSSProperties = {
  color: '#d97706',
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
  margin: '0 0 4px',
};

const buttonContainer: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '24px 0 0',
};

const button: React.CSSProperties = {
  backgroundColor: '#d97706',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 600,
  padding: '12px 28px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};
