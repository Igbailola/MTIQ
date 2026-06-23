import type { FaqItem } from '../types';

export const FAQS: FaqItem[] = [
  {
    question: 'How secure is my meeting transcript data?',
    answer: 'MeetIQ takes security seriously. Your meeting transcripts are stored in encrypted, private Supabase Storage buckets. Database connections use row-level security (RLS), and we never sell your data or use it to train public AI models.',
  },
  {
    question: 'What types of transcripts can I upload?',
    answer: 'You can upload plain text (.txt) files or copy-paste text directly into the dashboard. MeetIQ processes transcripts from any meeting platform (Zoom, Google Meet, Teams, Otter.ai, etc.) as long as it has speaker dialogue text.',
  },
  {
    question: 'How does the accountability flow work?',
    answer: 'Once AI suggestions are generated, they go into a draft state. When you publish them, target owners receive dashboard notifications. They can explicitly confirm accountability, request changes, or decline with a reason, boosting team alignment.',
  },
  {
    question: 'Can I set up notifications and reminders?',
    answer: 'Yes! MeetIQ features realtime updates on dashboards and can trigger email notifications for pending invitations, updates on assigned commitments, and automatic warnings for overdue items.',
  },
];
