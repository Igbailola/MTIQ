'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, ShieldCheck, Calendar, ChevronDown, ChevronUp, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import type { DemoCommitment, DemoDecision } from '@/lib/data/demo-meeting';

interface DemoSectionProps {
  demoMeetingData: {
    title: string;
    summary: { bullets: string[] };
    decisions: DemoDecision[];
  };
  demoCommitments: DemoCommitment[];
  expandedContexts: Record<string, boolean>;
  animatedCardId: string | null;
  loading: boolean;
  onChooseOther: () => void;
  onToggleContext: (id: string) => void;
  onAnimateCard: (id: string) => void;
  onSetDemoCommitments: (updater: (prev: DemoCommitment[]) => DemoCommitment[]) => void;
  onFinish: () => void;
}

export function DemoSection({
  demoMeetingData, demoCommitments, expandedContexts, animatedCardId, loading,
  onChooseOther, onToggleContext, onAnimateCard, onSetDemoCommitments, onFinish,
}: DemoSectionProps) {
  return (
    <div className="space-y-6 animate-fade-in bg-white border border-slate-200 rounded-xl p-6 shadow-meetiq-xs">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <span className="text-xs font-bold text-accent uppercase tracking-wider block">
            Interactive Sandbox &middot; Demo Mode
          </span>
          <h2 className="text-xl font-bold text-primary font-heading mt-1">
            {demoMeetingData.title}
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={onChooseOther} className="text-xs hover:bg-slate-50">
          Choose other option
        </Button>
      </div>

      <div className="ai-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="ai-label">AI Generated Summary</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            High confidence
          </span>
        </div>
        <ul className="space-y-2 text-sm text-slate-700 leading-relaxed pl-5 list-disc">
          {demoMeetingData.summary.bullets.map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider block">
          Extracted Decisions (3)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {demoMeetingData.decisions.map((decision) => (
            <div
              key={decision.id}
              className="border border-slate-100 bg-slate-50/50 rounded-lg p-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {decision.content}
              <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Decision</span>
                <span className="text-emerald-600">High Confidence</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider block">
            Extracted Commitments (4)
          </h3>
          <span className="text-xs text-slate-400 bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded">
            Interactive confirmation sandbox
          </span>
        </div>

        <div className="space-y-4">
          {demoCommitments.map((c) => {
            const isExpanded = !!expandedContexts[c.id];
            const displayStatus = c.status;

            return (
              <div
                key={c.id}
                className={`transition-all duration-200 ${
                  displayStatus === 'pending_confirmation'
                    ? 'ai-card p-5 space-y-4 shadow-meetiq-xs'
                    : displayStatus === 'completed'
                    ? 'border border-emerald-200 bg-emerald-50/10 rounded-xl p-5 space-y-4 shadow-meetiq-xs'
                    : displayStatus === 'blocked'
                    ? 'border border-amber-200 bg-amber-50/10 rounded-xl p-5 space-y-4 shadow-meetiq-xs'
                    : 'border border-slate-200/60 rounded-xl bg-white p-5 space-y-4 shadow-meetiq-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <span className="ai-label">AI Suggested Commitment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                      c.ai_confidence === 'high'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      {c.ai_confidence === 'high' ? 'High confidence' : 'Review suggested'}
                    </span>
                  </div>
                </div>

                <div className={`transition-transform duration-300 ${animatedCardId === c.id ? 'scale-98 opacity-90' : ''}`}>
                  <h4 className="font-heading font-bold text-base text-primary leading-tight">{c.title}</h4>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-1 font-body leading-normal">{c.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">Owner</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {c.owner?.display_name?.charAt(0) || 'U'}
                      </div>
                      <span className="font-medium text-slate-700 truncate">{c.owner?.display_name}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">Due Date</span>
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{c.due_date ? new Date(c.due_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : 'No Date'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">Priority</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                      c.priority === 'high' ? 'bg-red-50 text-red-700'
                        : c.priority === 'medium' ? 'bg-blue-50 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {c.priority}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">Status</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      displayStatus === 'pending_confirmation'
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : displayStatus === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : displayStatus === 'blocked'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {displayStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {c.context_snippet && (
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1">
                    <button
                      type="button"
                      onClick={() => onToggleContext(c.id)}
                      className="flex w-full items-center justify-between text-[10px] font-bold text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <span className="uppercase tracking-wider">AI Dialogue Context Snippet</span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    <p className={`text-xs text-slate-600 leading-relaxed font-body mt-1 italic ${isExpanded ? '' : 'line-clamp-1'}`}>
                      &ldquo;{c.context_snippet}&rdquo;
                    </p>
                  </div>
                )}

                {displayStatus === 'pending_confirmation' && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        onAnimateCard(c.id);
                        onSetDemoCommitments((prev) =>
                          prev.map((item) =>
                            item.id === c.id ? { ...item, status: 'blocked' as const } : item
                          )
                        );
                        toast.success('Commitment rejected / blocked');
                      }}
                      className="flex-1 text-center text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 font-semibold transition-all"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onAnimateCard(c.id);
                        onSetDemoCommitments((prev) =>
                          prev.map((item) =>
                            item.id === c.id ? { ...item, status: 'completed' as const } : item
                          )
                        );
                        toast.success('Commitment confirmed & accepted!');
                      }}
                      className="flex-1 text-center text-xs px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-all"
                    >
                      Confirm & Accept
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t mt-8">
        <Button onClick={onFinish} className="h-12 px-8 gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-md font-bold text-base" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          <span>Finish Onboarding</span>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
