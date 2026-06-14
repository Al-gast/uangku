export default function AccountsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-3 w-20 rounded-full bg-surface-muted" />
        <div className="mt-3 h-9 w-40 rounded-full bg-surface-muted" />
        <div className="mt-4 h-4 w-72 max-w-full rounded-full bg-surface-muted" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-24 rounded-card border border-border bg-surface shadow-card"
          />
        ))}
      </div>
    </div>
  );
}
