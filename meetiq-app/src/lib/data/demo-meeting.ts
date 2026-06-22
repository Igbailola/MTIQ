import type { Commitment, Profile } from '@/types/database';

export interface DemoDecision {
  id: string;
  content: string;
  ai_confidence: 'high' | 'medium' | 'low';
}

export interface DemoCommitment extends Commitment {
  owner?: Profile | null;
}

export interface DemoMeetingData {
  title: string;
  meeting_date: string;
  summary: {
    bullets: string[];
    ai_confidence: 'high' | 'medium' | 'low';
  };
  decisions: DemoDecision[];
  commitments: DemoCommitment[];
}

// Helper to calculate future date string
const getFutureDate = (daysAhead: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString();
};

export const demoMeetingData: DemoMeetingData = {
  title: 'Product Sprint Planning sync',
  meeting_date: new Date().toISOString().split('T')[0],
  summary: {
    bullets: [
      'Reviewed high-priority deliverables and assigned team ownership for the sprint milestones.',
      'Approved transitioning security protocols to PostgreSQL Row Level Security (RLS).',
      'Finalized design priorities and timeline for the new onboarding funnel.',
      'Scheduled a sync meeting for next week to review active commitments.'
    ],
    ai_confidence: 'high'
  },
  decisions: [
    {
      id: 'd1',
      content: 'Use PostgreSQL Row Level Security (RLS) as the primary authorization layer instead of application-level checks.',
      ai_confidence: 'high'
    },
    {
      id: 'd2',
      content: 'Deploy the server-side onboarding redirect logic using Next.js middleware to prevent user access bypass.',
      ai_confidence: 'high'
    },
    {
      id: 'd3',
      content: 'Standardize API response formats to follow the { success: boolean, data?: any, error?: string } pattern.',
      ai_confidence: 'medium'
    }
  ],
  commitments: [
    {
      id: 'c1',
      meeting_id: 'demo-meeting-id',
      title: 'Build auth token refresh middleware',
      description: 'Set up token refresh flow in Next.js middleware and secure cookie validation.',
      owner_id: 'owner-tolu',
      assigner_id: 'assigner-demo',
      status: 'pending_confirmation',
      priority: 'high',
      due_date: getFutureDate(2),
      ai_confidence: 'high',
      ai_owner_suggestion: 'owner-tolu',
      confirmed_at: null,
      completed_at: null,
      published: false,
      created_at: new Date().toISOString(),
      updated_at: null,
      context_snippet: 'Tolu, you\'ll need to write the middleware token refresh logic before Friday so we can test it.',
      owner: {
        id: 'owner-tolu',
        display_name: 'Tolu Awosika',
        avatar_url: null,
        onboarding_completed: true,
        timezone: 'UTC',
        created_at: new Date().toISOString(),
        updated_at: null
      }
    },
    {
      id: 'c2',
      meeting_id: 'demo-meeting-id',
      title: 'Design landing page wireframes',
      description: 'Create wireframes for desktop and mobile layouts with focus on the onboarding conversion funnel.',
      owner_id: 'owner-sarah',
      assigner_id: 'assigner-demo',
      status: 'pending_confirmation',
      priority: 'medium',
      due_date: getFutureDate(5),
      ai_confidence: 'high',
      ai_owner_suggestion: 'owner-sarah',
      confirmed_at: null,
      completed_at: null,
      published: false,
      created_at: new Date().toISOString(),
      updated_at: null,
      context_snippet: 'Sarah is going to design the onboarding pages first. We need those mockups by next Tuesday.',
      owner: {
        id: 'owner-sarah',
        display_name: 'Sarah Jenkins',
        avatar_url: null,
        onboarding_completed: true,
        timezone: 'EST',
        created_at: new Date().toISOString(),
        updated_at: null
      }
    },
    {
      id: 'c3',
      meeting_id: 'demo-meeting-id',
      title: 'Set up PostgreSQL Row Level Security policies',
      description: 'Define select/insert/update RLS policies for workspaces and commitments tables.',
      owner_id: 'owner-alex',
      assigner_id: 'assigner-demo',
      status: 'pending_confirmation',
      priority: 'high',
      due_date: getFutureDate(3),
      ai_confidence: 'medium',
      ai_owner_suggestion: 'owner-alex',
      confirmed_at: null,
      completed_at: null,
      published: false,
      created_at: new Date().toISOString(),
      updated_at: null,
      context_snippet: 'Let\'s make sure the database is secure. Alex, can you review the RLS rules?',
      owner: {
        id: 'owner-alex',
        display_name: 'Alex Rivera',
        avatar_url: null,
        onboarding_completed: true,
        timezone: 'PST',
        created_at: new Date().toISOString(),
        updated_at: null
      }
    },
    {
      id: 'c4',
      meeting_id: 'demo-meeting-id',
      title: 'Draft release notes for beta rollout',
      description: 'Summarize sprint achievements and prepare copy for the marketing announcement email.',
      owner_id: 'owner-tolu',
      assigner_id: 'assigner-demo',
      status: 'pending_confirmation',
      priority: 'low',
      due_date: getFutureDate(7),
      ai_confidence: 'medium',
      ai_owner_suggestion: 'owner-tolu',
      confirmed_at: null,
      completed_at: null,
      published: false,
      created_at: new Date().toISOString(),
      updated_at: null,
      context_snippet: 'Tolu will also draft the release notes once we wrap up the development sprint next week.',
      owner: {
        id: 'owner-tolu',
        display_name: 'Tolu Awosika',
        avatar_url: null,
        onboarding_completed: true,
        timezone: 'UTC',
        created_at: new Date().toISOString(),
        updated_at: null
      }
    }
  ]
};
