"use client";

import Link from "next/link";
import { usePrivacy } from "@/components/providers/privacy-provider";
import { MoneyText, PrivateText } from "@/components/ui/money-text";
import type { BudgetProgressItem } from "@/lib/budgets/types";

const MAX_VISIBLE_BUDGETS = 4;

export function BudgetSummary({
  budgets,
  error,
}: {
  budgets: BudgetProgressItem[];
  error: string | null;
}) {
  const { privacyEnabled } = usePrivacy();
  const visibleBudgets = [...budgets]
    .sort((a, b) => b.progressPercent - a.progressPercent)
    .slice(0, MAX_VISIBLE_BUDGETS);

  if (error) {
    return null;
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">Budget Bulan Ini</h2>
        <Link
          href="/settings/budgets"
          className="shrink-0 text-sm font-bold text-accent-strong"
        >
          Lihat semua
        </Link>
      </div>

      {visibleBudgets.length === 0 ? (
        <div className="rounded-card border border-dashed border-accent/30 bg-surface p-5 text-center shadow-card">
          <p className="text-sm font-semibold">Belum ada budget bulan ini.</p>
          <Link
            href="/settings/budgets/new"
            className="mt-3 inline-flex min-h-10 items-center rounded-control bg-accent px-4 text-sm font-bold text-accent-foreground"
          >
            + Buat Budget
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          {visibleBudgets.map((budget, index) => {
            const progress = Math.max(0, budget.progressPercent);
            const barWidth = Math.min(100, progress);
            const isExceeded = progress > 100;
            const isWarning = progress >= 80 && !isExceeded;

            return (
              <article
                key={budget.id}
                className={`p-4 ${
                  index > 0 ? "border-t border-border" : ""
                } ${isExceeded ? "bg-expense/10" : isWarning ? "bg-expense/5" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold">
                      {budget.categoryName}
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                      Terpakai <MoneyText value={budget.spent} /> dari{" "}
                      <MoneyText value={budget.amount} />
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-xs font-bold ${
                      isExceeded
                        ? "text-expense"
                        : isWarning
                          ? "text-expense/80"
                          : "text-accent-strong"
                    }`}
                  >
                    <PrivateText value={`${Math.round(progress)}%`} />
                  </p>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={`h-full rounded-full ${
                      isExceeded
                        ? "bg-expense"
                        : isWarning
                          ? "bg-expense/70"
                          : "bg-accent"
                    }`}
                    style={{
                      width: privacyEnabled ? "0%" : `${barWidth}%`,
                    }}
                  />
                </div>

                <p
                  className={`mt-2 text-xs ${
                    budget.remaining < 0 ? "text-expense" : "text-muted"
                  }`}
                >
                  {budget.remaining < 0 ? "Melebihi " : "Sisa "}
                  <MoneyText value={Math.abs(budget.remaining)} />
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
