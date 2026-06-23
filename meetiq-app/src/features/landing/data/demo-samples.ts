import type { DemoSample } from '../types';

export const DEMO_SAMPLES: DemoSample[] = [
  {
    title: 'Product Sprint Planning',
    transcript: `Alex: I will complete the API auth schemas and write the database migrations by Friday.
James: I can review the pull request as soon as Alex finishes it, probably on Saturday.
Alex: Sounds good. Let's make sure we use migration scripts for database version control.`,
    summaryBullets: [
      'Alex is building backend auth schemas and corresponding SQL migration scripts.',
      'James will perform peer review on the migration PR by Saturday.',
    ],
    decision: 'Use schema-based migration scripts for database version control.',
    commitments: [
      {
        title: 'Auth Schemas & DB Migrations',
        owner: 'Alex',
        due: 'Friday',
        priority: 'high',
        confidence: 'high',
      },
      {
        title: 'Review Migrations Pull Request',
        owner: 'James',
        due: 'Saturday',
        priority: 'medium',
        confidence: 'high',
      },
    ],
  },
  {
    title: 'Enterprise Client Onboarding',
    transcript: `Sarah: We need to set up the client sandbox environment before the training call next Tuesday.
Tolu: I'll coordinate the sandbox setup with the server team by Thursday afternoon.
Sarah: Perfect. Let's lock next Tuesday for training.`,
    summaryBullets: [
      'Team agreed to schedule the official client training call for next Tuesday.',
      'Tolu is responsible for sandbox environment availability prior to training.',
    ],
    decision: 'Client training date is locked for next Tuesday.',
    commitments: [
      {
        title: 'Coordinate Sandbox Environment Creation',
        owner: 'Tolu',
        due: 'Thursday',
        priority: 'high',
        confidence: 'high',
      },
    ],
  },
  {
    title: 'Mobile App Design Sync',
    transcript: `Emma: The mobile layouts look good. I'll export the Figma assets and design system tokens today.
David: Thanks Emma. I will start coding the responsive layout components tomorrow.
David: Let's approve these layout drafts as our version 1.0 baseline.`,
    summaryBullets: [
      'Figma mobile layouts approved as version 1.0 baseline drafts.',
      'Emma is exporting Figma assets and tokens today.',
      'David starts responsive design engineering tomorrow.',
    ],
    decision: 'Approve mobile design drafts as version 1.0 baseline.',
    commitments: [
      {
        title: 'Export Figma Assets & Tokens',
        owner: 'Emma',
        due: 'Today',
        priority: 'medium',
        confidence: 'high',
      },
      {
        title: 'Code Responsive Mobile Layouts',
        owner: 'David',
        due: 'Tomorrow',
        priority: 'high',
        confidence: 'high',
      },
    ],
  },
];
