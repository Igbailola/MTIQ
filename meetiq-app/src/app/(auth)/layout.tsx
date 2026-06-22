import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for Authentication pages (Login, Register, Forgot Password).
 * Standardized centered card view, high signal, low noise.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body">
      {/* Top Nav Bar */}
      <nav className="sticky top-0 z-50 border-b border-slate-100/50 bg-white/80 backdrop-blur-lg">
        <div className="flex h-[70px] items-center justify-between px-4 sm:px-6 md:px-[45px]">
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
          <div className="text-xs font-semibold text-muted-foreground hidden sm:block uppercase tracking-wider font-heading">
            AI-powered execution & accountability
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg space-y-8">
          <div className="bg-white border border-meetiq-border/30 rounded-xl p-6 sm:p-10 shadow-meetiq-xs">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
