"use client";

import Link from "next/link";
import { MoneyText, PrivateText } from "@/components/ui/money-text";
import type { MonthlyProjection } from "@/lib/insights/types";

const confidenceLabels: Record<
  MonthlyProjection["confidence"],
  string
> = {
  early: "Estimasi awal",
  developing: "Estimasi berkembang",
  stable: "Estimasi lebih stabil",
};

export function MonthlyProjectionCard({
  projection,
}: {
  projection: MonthlyProjection;
}) {
  if (!projection.available) {
    return null;
  }

  const netCashflowClass =
    projection.projectedNetCashflow >= 0 ? "text-income" : "text-expense";

  return (
    <section>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Proyeksi Akhir Bulan</h2>
          <p className="mt-1 text-sm text-muted">
            Berdasarkan pola pengeluaran {projection.elapsedDays} hari pertama.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[0.65rem] font-bold text-accent-strong">
          {confidenceLabels[projection.confidence]}
        </span>
      </div>

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <dl className="grid grid-cols-2 gap-3">
          <ProjectionItem label="Rata-rata per hari">
            <MoneyText value={projection.dailyExpenseAverage} />
          </ProjectionItem>
          <ProjectionItem label="Estimasi pengeluaran">
            <MoneyText
              value={projection.projectedExpense}
              className="text-expense"
            />
          </ProjectionItem>
          <ProjectionItem label="Estimasi net cashflow">
            <MoneyText
              value={Math.abs(projection.projectedNetCashflow)}
              sign={projection.projectedNetCashflow < 0 ? "-" : ""}
              className={netCashflowClass}
            />
          </ProjectionItem>
          <ProjectionItem label="Estimasi saving rate">
            <PrivateText
              value={
                projection.projectedSavingRate === null
                  ? "--"
                  : `${Math.round(projection.projectedSavingRate)}%`
              }
              masked="••%"
            />
          </ProjectionItem>
        </dl>

        <p className="mt-4 rounded-control bg-surface-muted p-3 text-xs leading-5 text-muted">
          Proyeksi memakai pemasukan yang sudah tercatat dan menganggap pola
          pengeluaran harian berlanjut sampai hari ke-{projection.totalDays}.
        </p>
      </div>

      {projection.budgetRisks.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-bold">Budget berisiko terlewati</h3>
          <div className="mt-2 overflow-hidden rounded-card border border-expense/20 bg-surface shadow-card">
            {projection.budgetRisks.map((budget, index) => (
              <Link
                key={budget.id}
                href={`/settings/budgets/${budget.id}/edit`}
                className={`flex items-center justify-between gap-4 p-4 transition hover:bg-expense/5 active:scale-[0.995] ${
                  index > 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {budget.categoryName}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Estimasi{" "}
                    <MoneyText value={budget.projectedSpent} /> dari{" "}
                    <MoneyText value={budget.budgetAmount} />
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold text-expense">
                    <PrivateText
                      value={`${Math.round(
                        budget.projectedProgressPercent,
                      )}%`}
                    />
                  </p>
                  <p className="mt-1 text-xs text-expense">
                    Lebih <MoneyText value={budget.projectedOverrun} />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ProjectionItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-control bg-surface-muted p-4">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="mt-2 text-base font-bold">{children}</dd>
    </div>
  );
}
