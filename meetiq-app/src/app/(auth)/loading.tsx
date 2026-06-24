import { Skeleton } from '@/components/ui/skeleton';

export default function AuthLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="sticky top-0 z-50 border-b border-slate-100/50 bg-white/80 backdrop-blur-lg">
        <div className="flex h-[70px] items-center justify-between px-4 sm:px-6 md:px-[45px]">
          <Skeleton className="h-9 w-[120px]" />
          <Skeleton className="h-4 w-48 hidden sm:block" />
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg space-y-8">
          <div className="bg-white border border-slate-200/30 rounded-xl p-6 sm:p-10 shadow-sm">
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <Skeleton className="h-8 w-32 mx-auto" />
                <Skeleton className="h-4 w-56 mx-auto" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
