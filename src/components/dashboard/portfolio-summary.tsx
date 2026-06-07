import Link from "next/link";
import { MoneyText } from "@/components/ui/money-text";
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
          <MoneyText
            as="p"
            value={summary.netWorth}
            className="mt-4 text-2xl font-extrabold"
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-surface-muted p-3">
              <p className="text-xs text-muted">Total aset</p>
              <MoneyText
                as="p"
                value={summary.totalAsset}
                className="mt-1 truncate text-sm font-bold"
              />
            </div>
            <div className="rounded-2xl bg-surface-muted p-3">
              <p className="text-xs text-muted">Total hutang</p>
              <MoneyText
                as="p"
                value={summary.totalLiability}
                className="mt-1 truncate text-sm font-bold text-debt"
              />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
