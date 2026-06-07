export function TypingIndicator() {
  return (
    <div className="flex justify-start" aria-label="Sedang membaca transaksi">
      <div className="flex items-center gap-1.5 rounded-card border border-border bg-surface px-4 py-3 shadow-card">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="size-1.5 animate-pulse rounded-full bg-muted"
            style={{ animationDelay: `${dot * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
