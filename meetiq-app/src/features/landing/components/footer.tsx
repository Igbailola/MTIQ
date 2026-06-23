import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
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
  );
}
