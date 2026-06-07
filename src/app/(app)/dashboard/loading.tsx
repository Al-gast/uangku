function Skeleton({
  className,
}: {
  className: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface-muted ${className}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-label="Memuat dashboard">
      <header>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-9 w-72 max-w-full" />
      </header>

      <section className="rounded-card bg-accent/70 p-5">
        <Skeleton className="h-3 w-40 bg-white/20" />
        <Skeleton className="mt-4 h-9 w-52 bg-white/25" />
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Skeleton className="h-16 bg-white/15" />
          <Skeleton className="h-16 bg-white/15" />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-28 border border-border bg-surface" />
        <Skeleton className="h-28 border border-border bg-surface" />
      </div>

      <section>
        <Skeleton className="h-6 w-28" />
        <div className="mt-3 flex gap-3 overflow-hidden">
          <Skeleton className="h-28 min-w-[140px] bg-surface" />
          <Skeleton className="h-28 min-w-[140px] bg-surface" />
          <Skeleton className="h-28 min-w-[140px] bg-surface" />
        </div>
      </section>

      <section>
        <div className="flex justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="mt-3 space-y-px overflow-hidden rounded-card border border-border bg-border">
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex bg-surface p-4">
              <Skeleton className="size-2 shrink-0 rounded-full" />
              <div className="ml-3 flex-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-2 h-3 w-36" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-3 h-20 w-full bg-surface" />
      </section>
    </div>
  );
}
