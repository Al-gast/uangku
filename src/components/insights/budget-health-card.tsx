"use client";

import Link from "next/link";
import { usePrivacy } from "@/components/providers/privacy-provider";
import { MoneyText, PrivateText } from "@/components/ui/money-text";
import type { BudgetHealthItem } from "@/lib/insights/types";

const MAX_VISIBLE_BUDGETS = 5;

export function BudgetHealthCard({
  budgets,
}: {
  budgets: BudgetHealthItem[];
}) {
  const { privacyEnabled } = usePrivacy();
  const visibleBudgets = budgets.slice(0, MAX_VISIBLE_BUDGETS);

  return (
    <section>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Kesehatan Budget</h2>
          <p className="mt-1 text-sm text-muted">
            Budget yang perlu dipantau bulan ini.
          </p>
        </div>
        <Link
          href="/settings/budgets"
          className="shrink-0 text-sm font-bold text-accent-strong"
        >
          Lihat semua
        </Link>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
        {visibleBudgets.length === 0 ? (
          <div className="p-5 text-sm text-muted">
            Belum ada budget bulan ini.
          </div>
        ) : (
          visibleBudgets.map((budget, index) => {
            const progress = Math.max(0, budget.progressPercent);
            const barWidth = Math.min(100, progress);
            const tone = getBudgetTone(budget.status);

            return (
              <article
                key={budget.id}
                className={`p-4 ${tone.background} ${
                  index > 0 ? "border-t border-border" : ""
                }`}
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
                  <p className={`shrink-0 text-xs font-bold ${tone.text}`}>
                    <PrivateText value={`${Math.round(progress)}%`} />
                  </p>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={`h-full rounded-full ${tone.bar}`}
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
          })
        )}
      </div>
    </section>
  );
}

function getBudgetTone(status: BudgetHealthItem["status"]) {
  if (status === "overbudget") {
    return {
      background: "bg-expense/10",
      text: "text-expense",
      bar: "bg-expense",
    };
  }

  if (status === "warning") {
    return {
      background: "bg-expense/5",
      text: "text-expense/80",
      bar: "bg-expense/70",
    };
  }

  return {
    background: "",
    text: "text-accent-strong",
    bar: "bg-accent",
  };
}
