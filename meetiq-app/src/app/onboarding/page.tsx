'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle2, Target, BarChart3 } from 'lucide-react';

const STEPS = [
  {
    icon: <Target className="h-8 w-8 text-blue-600" />,
    title: 'Turn Meetings into Action',
    description:
      'MeetIQ uses AI to extract decisions, action items, owners, and deadlines from your meeting notes or transcripts — so nothing falls through the cracks.',
    highlights: ['AI-powered extraction from any meeting format', 'Speaker-aware owner suggestions', 'Smart deadline detection with confidence scoring'],
  },
  {
    icon: <CheckCircle2 className="h-8 w-8 text-emerald-600" />,
    title: 'Clear Ownership & Accountability',
    description:
      'Every commitment requires explicit confirmation. Assignees accept, reject, or request changes — creating an undeniable chain of accountability.',
    highlights: ['Explicit accept / reject workflow', '48-hour escalation for unconfirmed items', 'Real-time status updates across your team'],
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-indigo-600" />,
    title: 'Track Everything to Completion',
    description:
      'Monitor all commitments from a central dashboard. See who owns what, what is overdue, and how your team is performing — all in real time.',
    highlights: ['Real-time KPI dashboard', 'Overdue commitment alerts', 'Team accountability matrix'],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      router.push('/register');
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    router.push('/register');
  };

  return (
    <div className="min-h-screen bg-white font-body">
      <nav className="sticky top-0 z-50 border-b border-slate-100/50 bg-white/80 backdrop-blur-lg">
        <div className="flex h-[70px] items-center justify-between px-[45px]">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/meetiq-logo.png"
              alt="MeetIQ"
              width={120}
              height={36}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          <button
            onClick={handleSkip}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Skip Onboarding
          </button>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-70px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-12">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-10 bg-slate-900'
                    : i < step
                    ? 'w-2 bg-slate-400'
                    : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>

          <div className="text-center">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50">
              {current.icon}
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/50 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 mb-4">
              <Sparkles className="h-3 w-3" />
              Step {step + 1} of {STEPS.length}
            </span>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading sm:text-4xl">
              {current.title}
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-base text-slate-500 leading-relaxed">
              {current.description}
            </p>

            <ul className="mx-auto mt-8 max-w-md space-y-3 text-left">
              {current.highlights.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={handleNext}
                className="group inline-flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3 text-base font-semibold text-white h-[52px] shadow-meetiq-md transition-all hover:bg-slate-800 hover:shadow-meetiq-lg hover:-translate-y-0.5"
              >
                {isLastStep ? 'Create Account' : 'Next'}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            <div className="mt-6">
              <button
                onClick={handleSkip}
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2"
              >
                Skip Onboarding
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
