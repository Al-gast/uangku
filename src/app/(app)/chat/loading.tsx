export default function ChatLoading() {
  return (
    <div className="animate-pulse" aria-label="Memuat chat">
      <div className="h-7 w-20 rounded bg-surface-muted" />
      <div className="mt-2 h-3 w-44 rounded bg-surface-muted" />
      <div className="mt-8 h-40 w-[88%] rounded-card bg-surface-muted" />
      <div className="mt-6 flex gap-2">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-9 w-24 rounded-full bg-surface-muted" />
        ))}
      </div>
      <div className="mt-4 h-14 rounded-control bg-surface-muted" />
    </div>
  );
}
