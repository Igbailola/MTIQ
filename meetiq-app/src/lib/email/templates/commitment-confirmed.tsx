import { Text, Button, Section } from 'react-email';
import * as React from 'react';
import { EmailLayout } from './email-layout';

/**
 * Email sent to the assigner when an owner accepts, rejects, or requests changes on a commitment.
 */

interface CommitmentConfirmedEmailProps {
  commitmentTitle: string;
  ownerName: string;
  action: 'accepted' | 'rejected' | 'requested changes on';
  reason?: string | null;
  commitmentUrl: string;
}

export function CommitmentConfirmedEmail({
  commitmentTitle,
  ownerName,
  action,
  reason,
  commitmentUrl,
}: CommitmentConfirmedEmailProps) {
  const actionColors: Record<string, string> = {
    accepted: '#22c55e',
    rejected: '#ef4444',
    'requested changes on': '#f59e0b',
  };

  const actionEmoji: Record<string, string> = {
    accepted: '✅',
    rejected: '❌',
    'requested changes on': '🔄',
  };

  return (
    <EmailLayout previewText={`${ownerName} ${action} "${commitmentTitle}"`}>
      <Text style={heading}>Commitment Update</Text>
      <Text style={paragraph}>
        <strong>{ownerName}</strong> has <strong>{action}</strong> the commitment:
      </Text>

      <Section style={card}>
        <Text style={statusBadge}>
          <span>{actionEmoji[action]} {action.charAt(0).toUpperCase() + action.slice(1)}</span>
        </Text>
        <Text style={cardTitle}>{commitmentTitle}</Text>
        {reason && (
          <>
            <Text style={reasonLabel}>Reason:</Text>
            <Text style={reasonText}>&quot;{reason}&quot;</Text>
          </>
        )}
      </Section>

      {action === 'rejected' && (
        <Text style={paragraph}>
          This commitment has been rejected. You may want to reassign it or discuss with the team.
        </Text>
      )}

      {action === 'requested changes on' && (
        <Text style={paragraph}>
          The owner has requested changes. Please review their feedback and update the commitment.
        </Text>
      )}

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
  backgroundColor: '#fafafa',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 20px',
};

const statusBadge: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  margin: '0 0 8px',
  textTransform: 'capitalize' as const,
};

const cardTitle: React.CSSProperties = {
  color: 'hsl(222, 47%, 11%)',
  fontSize: '16px',
  fontWeight: 600,
  margin: '0 0 8px',
};

const reasonLabel: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: 600,
  margin: '8px 0 2px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
};

const reasonText: React.CSSProperties = {
  color: '#374151',
  fontSize: '14px',
  fontStyle: 'italic',
  margin: '0',
  lineHeight: '20px',
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
