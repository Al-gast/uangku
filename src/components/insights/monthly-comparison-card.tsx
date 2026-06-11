"use client";

import Link from "next/link";
import { MoneyText, PrivateText } from "@/components/ui/money-text";
import { buildCashflowDrilldownHref } from "@/lib/insights/links";
import type {
  MonthlyComparison,
  MonthlyMetricComparison,
  MonthlyTrendDirection,
  SavingRateComparison,
} from "@/lib/insights/types";

export function MonthlyComparisonCard({
  comparison,
  monthKey,
}: {
  comparison: MonthlyComparison;
  monthKey: string;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-bold">Perbandingan Bulanan</h2>
        <p className="mt-1 text-sm text-muted">
          Dibandingkan dengan {comparison.previousMonthLabel}.
        </p>
      </div>

      {!comparison.hasPreviousTransactions ? (
        <div className="rounded-card border border-border bg-surface p-5 text-sm text-muted shadow-card">
          Belum ada transaksi pada {comparison.previousMonthLabel}, jadi tren
          belum bisa dibandingkan.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <MetricRow
              label="Pemasukan"
              comparison={comparison.income}
              favorableDirection="increase"
            />
            <MetricRow
              label="Pengeluaran"
              comparison={comparison.expense}
              favorableDirection="decrease"
            />
            <SavingRateRow comparison={comparison.savingRate} />
            <MetricRow
              label="Pembayaran cicilan"
              comparison={comparison.debtPayments}
              favorableDirection="decrease"
            />
            <MetricRow
              label="Biaya admin"
              comparison={comparison.adminFees}
              favorableDirection="decrease"
            />
          </div>

          {comparison.categoryIncreases.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-bold">Kategori yang meningkat</h3>
              <div className="mt-2 overflow-hidden rounded-card border border-border bg-surface shadow-card">
                {comparison.categoryIncreases.map((category, index) => (
                  <Link
                    key={category.categoryId}
                    href={buildCashflowDrilldownHref({
                      monthKey,
                      categoryId: category.categoryId,
                    })}
                    className={`flex items-center justify-between gap-4 p-4 transition hover:bg-surface-muted active:scale-[0.995] ${
                      index > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {category.categoryName}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Sekarang <MoneyText value={category.currentSpent} />
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <MoneyText
                        as="p"
                        value={category.delta}
                        sign="+"
                        className="text-sm font-bold text-expense"
                      />
                      <p className="mt-1 text-xs font-bold text-expense">
                        <PrivateText
                          value={
                            category.isNew
                              ? "Baru bulan ini"
                              : `+${Math.round(category.percentChange ?? 0)}%`
                          }
                          masked="••%"
                        />
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function MetricRow({
  label,
  comparison,
  favorableDirection,
}: {
  label: string;
  comparison: MonthlyMetricComparison;
  favorableDirection: Extract<
    MonthlyTrendDirection,
    "increase" | "decrease"
  >;
}) {
  const meta = trendMeta(comparison.direction, favorableDirection);

  return (
    <div className="flex items-center justify-between gap-4 border-t border-border p-4 first:border-t-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-xs text-muted">
          Sebelumnya <MoneyText value={comparison.previous} />
        </p>
      </div>
      <div className="shrink-0 text-right">
        <MoneyText
          as="p"
          value={comparison.current}
          className="text-sm font-bold"
        />
        <PrivateText
          value={metricTrendLabel(comparison)}
          masked="••%"
        />
        <span className={`ml-1 text-xs font-bold ${meta.className}`}>
          {meta.symbol}
        </span>
      </div>
    </div>
  );
}

function SavingRateRow({
  comparison,
}: {
  comparison: SavingRateComparison;
}) {
  const meta = trendMeta(comparison.direction, "increase");
  const current =
    comparison.current === null ? "--" : `${Math.round(comparison.current)}%`;
  const previous =
    comparison.previous === null
      ? "--"
      : `${Math.round(comparison.previous)}%`;
  const delta =
    comparison.deltaPoints === null
      ? "Belum tersedia"
      : `${comparison.deltaPoints > 0 ? "+" : ""}${Math.round(
          comparison.deltaPoints,
        )} poin`;

  return (
    <div className="flex items-center justify-between gap-4 border-t border-border p-4">
      <div>
        <p className="text-sm font-semibold">Saving rate</p>
        <p className="mt-1 text-xs text-muted">
          Sebelumnya <PrivateText value={previous} />
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold">
          <PrivateText value={current} />
        </p>
        <span className={`text-xs font-bold ${meta.className}`}>
          <PrivateText value={delta} /> {meta.symbol}
        </span>
      </div>
    </div>
  );
}

function metricTrendLabel(comparison: MonthlyMetricComparison) {
  if (comparison.direction === "new") {
    return "Baru bulan ini";
  }

  if (comparison.direction === "flat") {
    return "Tetap";
  }

  const change = Math.round(Math.abs(comparison.percentChange ?? 0));
  return `${comparison.direction === "increase" ? "+" : "-"}${change}%`;
}

function trendMeta(
  direction: MonthlyTrendDirection | "unavailable",
  favorableDirection: Extract<
    MonthlyTrendDirection,
    "increase" | "decrease"
  >,
) {
  if (direction === "flat" || direction === "unavailable") {
    return { symbol: "•", className: "text-muted" };
  }

  if (direction === "new") {
    return { symbol: "●", className: "text-accent-strong" };
  }

  return direction === favorableDirection
    ? {
        symbol: direction === "increase" ? "↑" : "↓",
        className: "text-income",
      }
    : {
        symbol: direction === "increase" ? "↑" : "↓",
        className: "text-expense",
      };
}
