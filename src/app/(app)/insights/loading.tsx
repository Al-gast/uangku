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

export default function InsightsLoading() {
  return (
    <div className="space-y-6" aria-label="Memuat rekap bulanan">
      <header>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-3 h-9 w-60 max-w-full" />
        <Skeleton className="mt-3 h-5 w-80 max-w-full" />
      </header>

      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-7 w-44" />
        <div className="mt-5 grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-20 bg-surface-muted" />
          ))}
        </div>
      </section>

      {[0, 1, 2].map((section) => (
        <section key={section}>
          <Skeleton className="h-6 w-44" />
          <div className="mt-3 overflow-hidden rounded-card border border-border bg-surface">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className={`p-4 ${item > 0 ? "border-t border-border" : ""}`}
              >
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="mt-3 h-2 w-full" />
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
