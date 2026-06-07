export default function CashflowLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Memuat cashflow">
      <header className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-3 w-20 rounded bg-surface-muted" />
          <div className="h-9 w-40 rounded bg-surface-muted" />
          <div className="h-4 w-full rounded bg-surface-muted" />
        </div>
        <div className="size-12 rounded-2xl bg-surface-muted" />
      </header>

      <div className="h-24 rounded-card bg-surface-muted" />

      <section className="space-y-3">
        <div className="h-6 w-40 rounded bg-surface-muted" />
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-36 rounded-card border border-border bg-surface"
          />
        ))}
      </section>
    </div>
  );
}
