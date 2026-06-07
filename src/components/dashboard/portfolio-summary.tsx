import Link from "next/link";
import { formatIdr } from "@/lib/format";
import type { PortfolioSummary } from "@/lib/portfolio/types";

export function DashboardPortfolioSummary({
  summary,
}: {
  summary: PortfolioSummary;
}) {
  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Portfolio
          </p>
          <h2 className="mt-2 text-lg font-bold">Net Worth</h2>
        </div>
        <Link
          href="/portfolio"
          className="text-sm font-bold text-accent-strong"
        >
          Lihat Portfolio →
        </Link>
      </div>

      {summary.error ? (
        <p className="mt-4 text-sm text-muted">
          Ringkasan portfolio belum bisa dimuat.
        </p>
      ) : (
        <>
          <p className="mt-4 text-2xl font-extrabold">
            {formatIdr(summary.netWorth)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-surface-muted p-3">
              <p className="text-xs text-muted">Total aset</p>
              <p className="mt-1 truncate text-sm font-bold">
                {formatIdr(summary.totalAsset)}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-muted p-3">
              <p className="text-xs text-muted">Total hutang</p>
              <p className="mt-1 truncate text-sm font-bold text-debt">
                {formatIdr(summary.totalLiability)}
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
