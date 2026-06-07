"use client";

import { useRouter } from "next/navigation";

export function PortfolioError() {
  const router = useRouter();

  return (
    <section className="rounded-card border border-expense/30 bg-surface p-6 text-center shadow-card">
      <div className="text-3xl">⚠️</div>
      <h2 className="mt-3 text-lg font-bold">
        Data portfolio belum bisa dimuat
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Ada masalah saat mengambil data aset dan hutang kamu.
      </p>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="mt-5 min-h-11 rounded-control bg-accent px-5 text-sm font-bold text-accent-foreground"
      >
        ↻ Refresh
      </button>
    </section>
  );
}
