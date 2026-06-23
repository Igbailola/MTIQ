'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Terminal, HelpCircle, Loader2 } from 'lucide-react';
import type { DemoSample } from '../types';

interface DemoPlaygroundProps {
  samples: DemoSample[];
}

export function DemoPlayground({ samples }: DemoPlaygroundProps) {
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(true);

  const currentSample = samples[activeSampleIndex];

  const handleProcessClick = () => {
    setIsProcessing(true);
    setHasProcessed(false);
    setTimeout(() => {
      setIsProcessing(false);
      setHasProcessed(true);
    }, 1200);
  };

  React.useEffect(() => {
    setHasProcessed(true);
    setIsProcessing(false);
  }, [activeSampleIndex]);

  return (
    <section className="py-20 bg-slate-50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 font-heading sm:text-4xl">
            See extraction in real-time
          </h2>
          <p className="mt-3 text-slate-500 text-sm sm:text-base">
            Select a sync type below, run the AI extraction, and explore how commitments are structured.
          </p>
        </div>

        <div className="flex justify-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          {samples.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSampleIndex(idx)}
              className={`px-4.5 py-2.5 rounded-lg text-sm font-semibold transition-all shrink-0 ${
                activeSampleIndex === idx
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100/50'
              }`}
            >
              {sample.title}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          <div className="lg:col-span-5 flex flex-col bg-white border border-slate-200 rounded-xl p-5 shadow-meetiq-xs">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Meeting Transcript
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 font-mono">
                {currentSample.transcript.split('\n').length} lines
              </span>
            </div>

            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-lg p-4 font-mono text-xs text-slate-600 leading-relaxed overflow-y-auto max-h-[250px] whitespace-pre-line">
              {currentSample.transcript}
            </div>

            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={handleProcessClick}
                disabled={isProcessing}
                className="w-full h-11 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Transcript...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Analyze Transcript</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col bg-white border border-slate-200 rounded-xl p-5 shadow-meetiq-xs relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                <span className="ai-label">AI Output Preview</span>
              </div>
              {hasProcessed && !isProcessing && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase">
                  High Confidence
                </span>
              )}
            </div>

            {isProcessing && (
              <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Analyzing Speaker Context...
                </span>
              </div>
            )}

            {!isProcessing && !hasProcessed && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-slate-400">
                <HelpCircle className="h-8 w-8 mb-2 text-slate-300" />
                <p className="text-sm font-medium">Click &quot;Analyze Transcript&quot; to run pipeline.</p>
              </div>
            )}

            {hasProcessed && !isProcessing && (
              <div className="space-y-5 animate-fade-in flex-1">
                <div className="ai-card p-4 space-y-2">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                    AI Generated Summary
                  </span>
                  <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4 font-body leading-relaxed">
                    {currentSample.summaryBullets.map((bullet, i) => (
                      <li key={i}>{bullet}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Decisions (1)
                  </span>
                  <div className="border border-slate-100 bg-slate-50/50 rounded-lg p-3 text-xs font-semibold text-slate-700">
                    {currentSample.decision}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Extracted Commitments ({currentSample.commitments.length})
                  </span>
                  <div className="space-y-2.5">
                    {currentSample.commitments.map((c, i) => (
                      <div key={i} className="ai-card p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="ai-label">AI Suggested</span>
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full capitalize">
                            {c.confidence} Confidence
                          </span>
                        </div>
                        <h4 className="text-xs font-bold font-heading text-primary">{c.title}</h4>
                        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 font-body">
                          <div>
                            <span className="block text-[9px] font-bold uppercase text-slate-400">Owner</span>
                            <strong className="text-slate-700 font-semibold">{c.owner}</strong>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold uppercase text-slate-400">Due</span>
                            <strong className="text-slate-700 font-semibold">{c.due}</strong>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold uppercase text-slate-400">Priority</span>
                            <strong className="text-slate-700 font-semibold capitalize">{c.priority}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
