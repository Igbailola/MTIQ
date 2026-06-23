import { Lock, Bell, Layers, CheckCircle2, Target, Users } from 'lucide-react';
import type { Benefit } from '../types';

const BENEFITS: Benefit[] = [
  {
    icon: <Lock className="h-5 w-5 text-blue-600" />,
    title: 'PII-Compliant RLS Storage',
    desc: 'Your uploads remain completely private. Meeting recordings and documents are secured behind Supabase Row Level Security.',
  },
  {
    icon: <Bell className="h-5 w-5 text-indigo-600" />,
    title: 'Confirm / Adjust / Reject',
    desc: 'Assignees get alerted of AI tasks. They must actively accept accountability, correct dates/details, or reject with comments.',
  },
  {
    icon: <Layers className="h-5 w-5 text-violet-600" />,
    title: 'Escalation Workflows',
    desc: 'If commitments are marked blocked or go overdue, automated system alerts ensure critical blockers get resolved immediately.',
  },
  {
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
    title: 'Context Verification Snippets',
    desc: 'Every commitment links back to the original speaker context segment in the transcript. Verify the exact wording in one click.',
  },
  {
    icon: <Target className="h-5 w-5 text-amber-600" />,
    title: 'Dynamic Command Palette',
    desc: 'Trigger workspace commands, switch dashboards, search commitments, or upload transcripts anywhere using Cmd+K on your layout.',
  },
  {
    icon: <Users className="h-5 w-5 text-pink-600" />,
    title: 'Team Accountability Matrix',
    desc: 'Track workspace stats like total suggested tasks, confirmed items, completion velocity, and individual task lists.',
  },
];

export function BenefitsGrid() {
  return (
    <section className="py-24 bg-white border-t border-slate-100">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            Product Overview
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 font-heading sm:text-4xl mt-4">
            Close the team accountability gap
          </h2>
          <p className="mt-3 text-slate-500 text-sm sm:text-base">
            MeetIQ solves task drift by establishing verifiable ownership over every meeting output.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BENEFITS.map((benefit, idx) => (
            <div
              key={idx}
              className="p-6 border border-slate-100 bg-slate-50/30 hover:bg-slate-50 rounded-xl transition-all duration-200 group"
            >
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white border border-slate-100 shadow-sm mb-4 group-hover:scale-105 transition-transform">
                {benefit.icon}
              </div>
              <h3 className="font-heading font-bold text-base text-slate-950 mb-2">
                {benefit.title}
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                {benefit.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
