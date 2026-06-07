import type { Metadata } from "next";
import Link from "next/link";
import { BudgetForm } from "@/components/budgets/budget-form";
import { getBudgetCategoryOptions } from "@/lib/budgets/data";

export const metadata: Metadata = {
  title: "Buat Budget",
};

export default async function NewBudgetPage() {
  const { categories, error } = await getBudgetCategoryOptions();

  return (
    <>
      <Link
        href="/settings/budgets"
        className="mb-5 inline-flex text-sm font-bold text-muted"
      >
        ← Budget
      </Link>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Batas pengeluaran
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
          Buat budget baru
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Pilih kategori yang ingin kamu jaga pengeluarannya setiap bulan.
        </p>
      </header>

      {error ? (
        <p className="rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {error}
        </p>
      ) : (
        <BudgetForm categories={categories} />
      )}
    </>
  );
}
