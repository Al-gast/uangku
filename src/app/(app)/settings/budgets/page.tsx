import type { Metadata } from "next";
import Link from "next/link";
import { BudgetList } from "@/components/budgets/budget-list";
import { getCurrentMonthBudgets } from "@/lib/budgets/data";

export const metadata: Metadata = {
  title: "Budget",
};

type BudgetsPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function BudgetsPage({
  searchParams,
}: BudgetsPageProps) {
  const [{ success, error: queryError }, result] = await Promise.all([
    searchParams,
    getCurrentMonthBudgets(),
  ]);

  return (
    <>
      <Link
        href="/settings"
        className="mb-5 inline-flex text-sm font-bold text-muted"
      >
        ← Settings
      </Link>
      <div className="mb-7 flex items-start justify-between gap-4">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {result.monthLabel}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
            Budget
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
            Atur batas pengeluaran bulanan supaya uang kamu lebih terarah.
          </p>
        </header>
        <Link
          href="/settings/budgets/new"
          className="mt-1 shrink-0 rounded-control bg-accent px-4 py-3 text-sm font-bold text-accent-foreground transition active:scale-[0.98]"
        >
          + Buat Budget
        </Link>
      </div>

      {success && (
        <p className="mb-5 rounded-control border border-income/30 bg-income/10 p-4 text-sm leading-6 text-income">
          {success}
        </p>
      )}
      {(queryError || result.error) && (
        <p className="mb-5 rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {queryError || result.error}
        </p>
      )}

      <BudgetList budgets={result.budgets} />
    </>
  );
}
