import Link from 'next/link';
import Image from 'next/image';

export function Navbar() {
  return (
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
  );
}
