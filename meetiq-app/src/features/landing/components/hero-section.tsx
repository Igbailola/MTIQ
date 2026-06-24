import Link from 'next/link';
import { ArrowRight, Shield, Zap, Clock, Sparkles } from 'lucide-react';

export function HeroSection() {
  return (
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

        <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-8 py-2 text-base font-bold text-white h-[54px] shadow-meetiq-md transition-all hover:bg-slate-900 hover:shadow-meetiq-lg hover:-translate-y-0.5 sm:w-auto"
          >
            Start Free Trial
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-2 text-base font-semibold text-slate-700 h-[54px] shadow-meetiq-xs transition-all hover:border-slate-300 hover:shadow-meetiq-sm sm:w-auto"
          >
            Access Dashboard
          </Link>
        </div>

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
  );
}
