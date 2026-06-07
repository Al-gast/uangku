"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createBudget,
  updateBudget,
  type BudgetActionState,
} from "@/app/(app)/settings/budgets/actions";
import type { BudgetCategoryOption } from "@/lib/budgets/types";

type BudgetFormProps = {
  categories: BudgetCategoryOption[];
  budget?: {
    id: string;
    categoryId: string;
    amount: number;
  };
};

const initialState: BudgetActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-13 w-full items-center justify-center rounded-control bg-accent px-5 font-bold text-accent-foreground transition hover:bg-accent-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Menyimpan..." : "Simpan Budget"}
    </button>
  );
}

export function BudgetForm({ categories, budget }: BudgetFormProps) {
  const action = budget ? updateBudget : createBudget;
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {budget && <input type="hidden" name="budget_id" value={budget.id} />}

      {state.error && (
        <p className="rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {state.error}
        </p>
      )}

      <label className="block">
        <span className="mb-2 block text-sm font-bold">Kategori</span>
        <select
          name="category_id"
          required
          defaultValue={budget?.categoryId ?? categories[0]?.id ?? ""}
          className="min-h-12 w-full rounded-control border border-border bg-surface px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold">Nominal budget</span>
        <div className="flex min-h-14 items-center rounded-control border border-border bg-surface px-4 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
          <span className="mr-2 font-bold text-muted">Rp</span>
          <input
            name="amount"
            inputMode="numeric"
            required
            defaultValue={budget?.amount ?? ""}
            placeholder="0"
            className="min-w-0 flex-1 bg-transparent text-right text-xl font-bold outline-none"
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold">Periode</span>
        <div className="flex min-h-12 items-center rounded-control border border-border bg-surface-muted px-4 font-semibold text-muted">
          Bulanan
        </div>
      </label>

      <SubmitButton />
      <Link
        href="/settings/budgets"
        className="flex min-h-11 items-center justify-center font-bold text-muted"
      >
        Batal
      </Link>
    </form>
  );
}
