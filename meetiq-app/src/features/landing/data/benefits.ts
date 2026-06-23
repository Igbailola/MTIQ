import type { Benefit } from '../types';

export const BENEFITS: Benefit[] = [
  {
    icon: 'Lock',
    title: 'PII-Compliant RLS Storage',
    desc: 'Your uploads remain completely private. Meeting recordings and documents are secured behind Supabase Row Level Security.',
  },
  {
    icon: 'Bell',
    title: 'Confirm / Adjust / Reject',
    desc: 'Assignees get alerted of AI tasks. They must actively accept accountability, correct dates/details, or reject with comments.',
  },
  {
    icon: 'Layers',
    title: 'Escalation Workflows',
    desc: 'If commitments are marked blocked or go overdue, automated system alerts ensure critical blockers get resolved immediately.',
  },
  {
    icon: 'CheckCircle2',
    title: 'Context Verification Snippets',
    desc: 'Every commitment links back to the original speaker context segment in the transcript. Verify the exact wording in one click.',
  },
  {
    icon: 'Target',
    title: 'Dynamic Command Palette',
    desc: 'Trigger workspace commands, switch dashboards, search commitments, or upload transcripts anywhere using Cmd+K on your layout.',
  },
  {
    icon: 'Users',
    title: 'Team Accountability Matrix',
    desc: 'Track workspace stats like total suggested tasks, confirmed items, completion velocity, and individual task lists.',
  },
];
