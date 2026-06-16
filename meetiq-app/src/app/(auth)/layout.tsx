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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <Link href="/" className="focus-visible:outline-none">
              <Image
                src="/meetiq-logo.png"
                alt="MeetIQ"
                width={112}
                height={32}
                className="h-8 w-auto object-contain"
                priority
              />
            </Link>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground font-body">
            AI-powered execution and accountability
          </p>
        </div>
        <div className="bg-white border border-meetiq-border/30 rounded-xl p-10 shadow-meetiq-xs">
          {children}
        </div>
      </div>
    </div>
  );
}
