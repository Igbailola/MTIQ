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
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-body">
      {/* Navigation */}
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
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 text-base font-medium text-slate-600 h-[48px] inline-flex items-center transition-colors hover:text-slate-900 hover:bg-slate-50"
            >
              Sign In
            </Link>
            <Link
              href="/onboarding"
              className="rounded-lg bg-slate-900 px-4 text-base font-medium text-white h-[48px] inline-flex items-center transition-all hover:bg-slate-800 shadow-meetiq-xs hover:shadow-meetiq-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 via-white to-white" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-blue-100/40 to-indigo-100/30 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/50 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700 mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Execution Accountability
          </div>

          <h1 className="mx-auto text-5xl font-bold tracking-tight text-slate-900 font-heading sm:text-6xl lg:text-7xl leading-[1.1]">
            Turn meetings into{' '}
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              confirmed commitments.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500 leading-relaxed">
            MeetIQ uses AI to extract decisions and action items from your meeting transcripts,
            then tracks ownership and accountability - so nothing falls through the cracks.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/onboarding"
              className="group inline-flex items-center gap-2 rounded-xl bg-slate-900 px-7 py-2 text-base font-semibold text-white h-[52px] shadow-meetiq-md transition-all hover:bg-slate-800 hover:shadow-meetiq-lg hover:-translate-y-0.5"
            >
              Start Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/50 bg-white px-7 py-2 text-base font-semibold text-slate-700 h-[52px] shadow-meetiq-xs transition-all hover:border-slate-300/50 hover:shadow-meetiq-sm"
            >
              Sign In to Dashboard
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-14 flex items-center justify-center gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              <span>Real-time Processing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>Setup in 2 minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-slate-100/50 bg-slate-50/50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-heading sm:text-4xl">
              How MeetIQ works
            </h2>
            <p className="mt-3 text-base text-slate-500 max-w-lg mx-auto">
              Three simple steps to close the accountability gap in your team.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                icon: <Target className="h-6 w-6" />,
                title: 'Upload Meeting Notes',
                description:
                  'Paste your transcript or upload a file. MeetIQ accepts text from any meeting tool - Zoom, Teams, Google Meet, or plain notes.',
              },
              {
                step: '02',
                icon: <Sparkles className="h-6 w-6" />,
                title: 'AI Extracts Commitments',
                description:
                  'GPT-4 identifies decisions, action items, owners, deadlines, and priorities - all with confidence scores you can trust.',
              },
              {
                step: '03',
                icon: <CheckCircle2 className="h-6 w-6" />,
                title: 'Confirm & Track',
                description:
                  'Assignees confirm ownership, update status, and the dashboard shows real-time accountability metrics for the whole team.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative rounded-2xl border border-slate-200/50 bg-white p-8 shadow-meetiq-xs transition-all hover:shadow-meetiq-sm hover:border-slate-300/50 hover:-translate-y-1"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                    {item.icon}
                  </div>
                  <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">
                    Step {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 font-heading mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100/50 bg-white py-10">
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
