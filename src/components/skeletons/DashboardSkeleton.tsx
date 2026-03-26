import { Skeleton } from '@/components/ui/skeleton';

export function DashboardCardSkeleton() {
  return (
    <div className="bg-card p-6 rounded-xl border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24 bg-muted" />
          <Skeleton className="h-7 w-20 bg-muted" />
        </div>
        <Skeleton className="w-10 h-10 rounded-lg bg-muted" />
      </div>
      <Skeleton className="h-4 w-32 bg-muted" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 bg-muted" />
          <Skeleton className="h-4 w-32 bg-muted" />
        </div>
        <Skeleton className="w-10 h-10 rounded-xl bg-muted" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <Skeleton className="h-5 w-32 bg-muted mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3">
                <Skeleton className="w-8 h-8 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-muted" />
                  <Skeleton className="h-3 w-16 bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <Skeleton className="h-5 w-28 bg-muted mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3">
                <Skeleton className="w-8 h-8 rounded-lg bg-muted" />
                <Skeleton className="h-4 w-32 bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
