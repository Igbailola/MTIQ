'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Clock,
  Target,
  CheckCircle2,
  Lock,
  Bell,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Check,
  Play,
  Users,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Terminal,
  Layers,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DemoSample {
  title: string;
  transcript: string;
  summaryBullets: string[];
  decision: string;
  commitments: {
    title: string;
    owner: string;
    due: string;
    priority: 'low' | 'medium' | 'high';
    confidence: 'high' | 'medium' | 'low';
  }[];
}

const DEMO_SAMPLES: DemoSample[] = [
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

const FAQS = [
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

export default function Home() {
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(true);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  const currentSample = DEMO_SAMPLES[activeSampleIndex];

  const handleProcessClick = () => {
    setIsProcessing(true);
    setHasProcessed(false);
    setTimeout(() => {
      setIsProcessing(false);
      setHasProcessed(true);
    }, 1200);
  };

  useEffect(() => {
    setHasProcessed(true);
    setIsProcessing(false);
  }, [activeSampleIndex]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-body selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-lg">
        <div className="flex h-[72px] items-center justify-between px-4 sm:px-6 md:px-[45px]">
          <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none">
            <Image
              src="/meetiq-logo.png"
              alt="MeetIQ"
              width={120}
              height={36}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 text-base font-semibold text-slate-600 h-[44px] inline-flex items-center transition-colors hover:text-slate-950 hover:bg-slate-50"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-slate-900 px-5 text-base font-semibold text-white h-[44px] inline-flex items-center transition-all hover:bg-slate-800 shadow-meetiq-xs hover:shadow-meetiq-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 bg-white border-b border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/40 via-white to-white" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-tr from-blue-100/30 to-indigo-100/20 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/50 bg-blue-50 px-4.5 py-1.5 text-xs font-bold text-blue-700 tracking-wider uppercase mb-6">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            AI-Powered Sync Accountability
          </div>

          <h1 className="mx-auto text-4xl font-extrabold tracking-tight text-slate-950 font-heading sm:text-6xl lg:text-7xl leading-[1.08] max-w-4xl">
            Turn meeting transcripts into{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              confirmed commitments.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-500 leading-relaxed font-body">
            Stop losing track of sync items. MeetIQ extracts decisions, suggests owners, and demands explicit commitment confirmation from assignees.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-slate-950 px-8 py-2 text-base font-bold text-white h-[54px] shadow-meetiq-md transition-all hover:bg-slate-900 hover:shadow-meetiq-lg hover:-translate-y-0.5"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-2 text-base font-semibold text-slate-700 h-[54px] shadow-meetiq-xs transition-all hover:border-slate-300 hover:shadow-meetiq-sm"
            >
              Access Dashboard
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-6 md:gap-10 text-xs font-semibold text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-400" />
              <span>SOC 2 Compliant Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-slate-400" />
              <span>GPT-4 Extraction Precision</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>Zero-config Onboarding</span>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE DEMO PLAYGROUND */}
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

          {/* Tab Selection */}
          <div className="flex justify-center gap-2 overflow-x-auto pb-4 scrollbar-none">
            {DEMO_SAMPLES.map((sample, idx) => (
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

          {/* Interactive Shell */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
            {/* Input Transcript Card */}
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

            {/* AI Output Card (Glassmorphic Tint) */}
            <div className="lg:col-span-7 flex flex-col bg-white border border-slate-200 rounded-xl p-5 shadow-meetiq-xs relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                  <span className="ai-label">
                    AI Output Preview
                  </span>
                </div>
                {hasProcessed && !isProcessing && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase">
                    High Confidence
                  </span>
                )}
              </div>

              {/* Loader placeholder */}
              {isProcessing && (
                <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    Analyzing Speaker Context...
                  </span>
                </div>
              )}

              {/* Default Empty State */}
              {!isProcessing && !hasProcessed && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-slate-400">
                  <HelpCircle className="h-8 w-8 mb-2 text-slate-300" />
                  <p className="text-sm font-medium">Click &quot;Analyze Transcript&quot; to run pipeline.</p>
                </div>
              )}

              {/* Extracted Data View */}
              {hasProcessed && !isProcessing && (
                <div className="space-y-5 animate-fade-in flex-1">
                  {/* Summary Bullets */}
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

                  {/* Decision */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Decisions (1)
                    </span>
                    <div className="border border-slate-100 bg-slate-50/50 rounded-lg p-3 text-xs font-semibold text-slate-700">
                      {currentSample.decision}
                    </div>
                  </div>

                  {/* Commitments list */}
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

      {/* CORE BENEFITS MATRIX */}
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
            {[
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
            ].map((benefit, idx) => (
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

      {/* PRICING PLANS */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              Simple Pricing
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 font-heading sm:text-4xl mt-4">
              Designed for teams of all sizes
            </h2>
            <p className="mt-3 text-slate-500 text-sm sm:text-base">
              Get started with our free tier, and upgrade to unlock advanced AI models and integrations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Free Tier */}
            <div className="flex flex-col bg-white border border-slate-200 rounded-2xl p-8 shadow-meetiq-xs relative">
              <div className="mb-6">
                <h3 className="font-heading font-extrabold text-lg text-slate-900">Sandbox Sandbox</h3>
                <p className="text-slate-400 text-xs mt-1">For testing MeetIQ on basic syncs</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-950">$0</span>
                  <span className="text-slate-400 text-sm ml-1">/ forever</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 text-xs sm:text-sm text-slate-600 flex-1">
                {['3 meeting uploads / mo', 'Basic transcript extraction', '1 Workspace', 'In-app notifications', 'Standard search'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="w-full h-11 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-background text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-meetiq-xs"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Tier (Recommended) */}
            <div className="flex flex-col bg-white border-2 border-blue-600 rounded-2xl p-8 shadow-meetiq-sm relative">
              <span className="absolute top-0 right-6 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </span>
              <div className="mb-6">
                <h3 className="font-heading font-extrabold text-lg text-slate-900">Pro Team</h3>
                <p className="text-slate-400 text-xs mt-1">For growing teams tracking execution</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-950">$29</span>
                  <span className="text-slate-400 text-sm ml-1">/ month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 text-xs sm:text-sm text-slate-600 flex-1">
                {[
                  'Unlimited meeting uploads',
                  'GPT-4 precision extraction',
                  'Escalation pathway setup',
                  'Email & Slack notifications',
                  'Advanced accountability stats',
                  'Priority processing queue',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="font-semibold text-slate-700">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="w-full h-11 inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-bold text-white transition-colors shadow-meetiq-sm"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise Tier */}
            <div className="flex flex-col bg-white border border-slate-200 rounded-2xl p-8 shadow-meetiq-xs">
              <div className="mb-6">
                <h3 className="font-heading font-extrabold text-lg text-slate-900">Enterprise Scale</h3>
                <p className="text-slate-400 text-xs mt-1">For secure, high-compliance corps</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-950">Custom</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 text-xs sm:text-sm text-slate-600 flex-1">
                {[
                  'Dedicated API node instances',
                  'Automated PII scrubbing scripts',
                  'SAML SSO & Okta integration',
                  '99.9% uptime SLA guarantee',
                  'Custom DB migration assistance',
                  'Dedicated support manager',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="w-full h-11 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-background text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-meetiq-xs"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              FAQ
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 font-heading sm:text-4xl mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="border-t border-slate-100 divide-y divide-slate-100">
            {FAQS.map((faq, idx) => {
              const isOpen = faqOpenIndex === idx;

              return (
                <div key={idx} className="py-5">
                  <button
                    onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between text-left font-heading font-bold text-base text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 text-slate-400 shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400 shrink-0 ml-4" />
                    )}
                  </button>

                  <div
                    className={`transition-all duration-300 overflow-hidden ${
                      isOpen ? 'max-h-[200px] mt-3' : 'max-h-0'
                    }`}
                  >
                    <p className="text-sm text-slate-500 leading-relaxed font-body">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/30 via-transparent to-transparent" />
        
        <div className="relative mx-auto max-w-5xl px-6 text-center space-y-6">
          <h2 className="text-3xl font-extrabold font-heading sm:text-4xl tracking-tight">
            Stop losing track of sync outcomes today
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Set up MeetIQ in minutes, upload your first meeting notes, and let the accountability engine run.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3 text-base font-bold text-slate-950 shadow-md hover:bg-slate-50 transition-all hover:-translate-y-0.5"
            >
              Sign Up Now
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-transparent px-8 py-3 text-base font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            >
              Explore Sandbox
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="focus-visible:outline-none">
              <Image
                src="/meetiq-logo.png"
                alt="MeetIQ"
                width={100}
                height={30}
                className="h-7 w-auto object-contain"
              />
            </Link>
          </div>
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} MeetIQ. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
