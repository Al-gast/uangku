import type { Metadata } from "next";
import Link from "next/link";
import { BudgetForm } from "@/components/budgets/budget-form";
import {
  getBudget,
  getBudgetCategoryOptions,
} from "@/lib/budgets/data";

export const metadata: Metadata = {
  title: "Edit Budget",
};

type EditBudgetPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBudgetPage({
  params,
}: EditBudgetPageProps) {
  const { id } = await params;
  const [budget, options] = await Promise.all([
    getBudget(id),
    getBudgetCategoryOptions(),
  ]);

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
          Perbarui batas
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
          Edit budget
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Ubah kategori atau nominal budget bulanan kamu.
        </p>
      </header>

      {options.error ? (
        <p className="rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {options.error}
        </p>
      ) : (
        <BudgetForm
          categories={options.categories}
          budget={{
            id: budget.id,
            categoryId: budget.categoryId,
            amount: budget.amount,
          }}
        />
      )}
    </>
  );
}
