import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Img,
} from 'react-email';
import * as React from 'react';

/**
 * Shared email layout for all MeetIQ transactional emails.
 * Provides consistent branding: header, content slot, and footer.
 */

interface EmailLayoutProps {
  previewText?: string;
  children: React.ReactNode;
}

export function EmailLayout({ previewText, children }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={body}>
        {previewText && (
          <Text style={preview}>{previewText}</Text>
        )}
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>
              <span style={logoIcon}>⚡</span> MeetIQ
            </Text>
            <Text style={tagline}>From Conversation to Execution</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={content}>
            {children}
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              This is an automated notification from MeetIQ.
            </Text>
            <Text style={footerText}>
              You're receiving this because you have an account on MeetIQ.
            </Text>
            <Text style={footerLink}>
              <a href="https://meetiq-seven.vercel.app" style={link}>
                meetiq-seven.vercel.app
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ──

const body: React.CSSProperties = {
  backgroundColor: '#f4f6f9',
  fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  margin: 0,
  padding: 0,
};

const preview: React.CSSProperties = {
  display: 'none',
  fontSize: '1px',
  color: '#f4f6f9',
  lineHeight: '1px',
  maxHeight: 0,
  maxWidth: 0,
  opacity: 0,
  overflow: 'hidden',
};

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e2e5ec',
  margin: '40px auto',
  maxWidth: '560px',
  padding: '0',
  overflow: 'hidden',
};

const header: React.CSSProperties = {
  backgroundColor: 'hsl(222, 47%, 11%)',
  padding: '28px 32px 20px',
  textAlign: 'center' as const,
};

const logoText: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 700,
  margin: '0 0 4px',
  letterSpacing: '-0.02em',
};

const logoIcon: React.CSSProperties = {
  fontSize: '20px',
  marginRight: '4px',
};

const tagline: React.CSSProperties = {
  color: 'hsl(217, 91%, 75%)',
  fontSize: '13px',
  fontWeight: 400,
  margin: 0,
  letterSpacing: '0.02em',
};

const divider: React.CSSProperties = {
  borderColor: '#e2e5ec',
  margin: 0,
};

const content: React.CSSProperties = {
  padding: '32px',
};

const footer: React.CSSProperties = {
  padding: '20px 32px 24px',
  textAlign: 'center' as const,
};

const footerText: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0 0 4px',
};

const footerLink: React.CSSProperties = {
  margin: '8px 0 0',
};

const link: React.CSSProperties = {
  color: 'hsl(217, 91%, 60%)',
  fontSize: '12px',
  textDecoration: 'none',
};
