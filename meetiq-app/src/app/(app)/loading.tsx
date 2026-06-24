import { Skeleton } from '@/components/ui/skeleton';

export default function AppLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* TopNav skeleton */}
      <header className="sticky top-0 z-50 border-b border-slate-100/50 bg-white/80 backdrop-blur-lg">
        <div className="flex h-[70px] items-center justify-between px-4 sm:px-6 md:px-[45px]">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-[120px]" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-0">
        {/* Sidebar skeleton */}
        <aside className="hidden md:flex fixed left-0 top-[70px] bottom-0 w-[280px] flex-col border-r border-slate-100/50 bg-white p-4 gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
          <div className="mt-auto">
            <Skeleton className="h-10 w-full" />
          </div>
        </aside>

        {/* Main content skeleton */}
        <main className="flex-1 md:pl-[280px] pb-16 md:pb-0">
          <div className="max-w-[1280px] mx-auto px-4 py-8 md:px-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </div>
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
