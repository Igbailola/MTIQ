import Link from 'next/link';

export function CtaSection() {
  return (
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
  );
}
