export default function PortfolioLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-3 w-20 rounded bg-surface-muted" />
        <div className="h-9 w-40 rounded bg-surface-muted" />
        <div className="h-4 w-full rounded bg-surface-muted" />
      </div>
      <div className="h-40 rounded-card bg-accent/30" />
      <div className="h-60 rounded-card bg-surface-muted" />
      <div className="space-y-3">
        <div className="h-6 w-32 rounded bg-surface-muted" />
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-16 rounded-card bg-surface-muted" />
        ))}
      </div>
    </div>
  );
}
