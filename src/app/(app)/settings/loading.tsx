export default function SettingsLoading() {
  return (
    <div className="animate-pulse" aria-label="Memuat settings">
      <div className="h-3 w-24 rounded bg-surface-muted" />
      <div className="mt-3 h-9 w-40 rounded bg-surface-muted" />
      <div className="mt-3 h-4 w-full rounded bg-surface-muted" />
      <div className="mt-7 space-y-3">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="h-24 rounded-card bg-surface-muted" />
        ))}
      </div>
    </div>
  );
}
