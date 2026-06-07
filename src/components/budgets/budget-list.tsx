"use client";

import Link from "next/link";
import { deleteBudget } from "@/app/(app)/settings/budgets/actions";
import { usePrivacy } from "@/components/providers/privacy-provider";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import { MoneyText, PrivateText } from "@/components/ui/money-text";
import type { BudgetProgressItem } from "@/lib/budgets/types";

export function BudgetList({
  budgets,
}: {
  budgets: BudgetProgressItem[];
}) {
  const { privacyEnabled } = usePrivacy();

  if (budgets.length === 0) {
    return (
      <section className="rounded-card border border-dashed border-accent/40 bg-surface p-7 text-center shadow-card">
        <h2 className="font-bold">Belum ada budget</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Buat budget pertama supaya pengeluaran lebih terarah.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {budgets.map((budget) => {
        const progress = Math.max(0, budget.progressPercent);
        const barWidth = Math.min(100, progress);
        const isWarning = progress >= 80;

        return (
          <article
            key={budget.id}
            className="rounded-card border border-border bg-surface p-5 shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold">{budget.categoryName}</h2>
                <p className="mt-1 text-xs text-muted">Budget bulanan</p>
              </div>
              <MoneyText
                as="p"
                value={budget.amount}
                className="text-sm font-bold"
              />
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
              <div
                className={`h-full rounded-full ${
                  isWarning ? "bg-expense" : "bg-accent"
                }`}
                style={{ width: privacyEnabled ? "0%" : `${barWidth}%` }}
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted">Terpakai</p>
                <MoneyText
                  as="p"
                  value={budget.spent}
                  className="mt-1 font-bold"
                />
              </div>
              <div>
                <p className="text-muted">Sisa</p>
                <MoneyText
                  as="p"
                  value={budget.remaining}
                  className={`mt-1 font-bold ${
                    budget.remaining < 0 ? "text-expense" : ""
                  }`}
                />
              </div>
              <div className="text-right">
                <p className="text-muted">Progress</p>
                <p className="mt-1 font-bold">
                  <PrivateText value={`${Math.round(progress)}%`} />
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-4 border-t border-border pt-3">
              <Link
                href={`/settings/budgets/${budget.id}/edit`}
                className="text-sm font-bold text-accent-strong"
              >
                Edit
              </Link>
              <ConfirmActionForm
                submitAction={deleteBudget}
                fields={[{ name: "budget_id", value: budget.id }]}
                buttonLabel="Hapus"
                title="Hapus budget ini?"
                description="Transaksi kamu tetap aman. Hanya aturan budget ini yang dihapus."
                confirmLabel="Hapus Budget"
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
