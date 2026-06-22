import { Text, Button, Section } from 'react-email';
import * as React from 'react';
import { EmailLayout } from './email-layout';

interface WorkspaceInviteEmailProps {
  workspaceName: string;
  inviterName: string;
  inviteUrl: string;
}

export function WorkspaceInviteEmail({
  workspaceName,
  inviterName,
  inviteUrl,
}: WorkspaceInviteEmailProps) {
  return (
    <EmailLayout previewText={`Invitation to join workspace: ${workspaceName}`}>
      <Text style={heading}>Workspace Invitation</Text>
      
      <Text style={paragraph}>
        <strong>{inviterName}</strong> has invited you to collaborate on their MeetIQ workspace: <strong>&quot;{workspaceName}&quot;</strong>.
      </Text>

      <Text style={paragraph}>
        MeetIQ helps teams turn meeting conversations into confirmed commitments and track real-time accountability. Joining will allow you to view, accept, and update status of commitments assigned to you.
      </Text>

      <Section style={card}>
        <Text style={cardLabel}>WORKSPACE</Text>
        <Text style={cardTitle}>{workspaceName}</Text>
        <Text style={cardMeta}>Invited by: {inviterName}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={inviteUrl}>
          Join Workspace
        </Button>
      </Section>

      <Text style={smallText}>
        If you don&apos;t have an account yet, you will be prompted to register and then added to the workspace.
      </Text>
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

const cardLabel: React.CSSProperties = {
  color: 'hsl(217, 91%, 60%)',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.05em',
  margin: '0 0 4px',
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
  margin: 0,
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
  padding: '12px 28px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};

const smallText: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '16px 0 0',
  lineHeight: '18px',
};
