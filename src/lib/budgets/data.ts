import "server-only";

import { notFound } from "next/navigation";
import { getJakartaMonthRange } from "@/lib/date";
import type {
  BudgetCategoryOption,
  BudgetProgressItem,
  BudgetWarning,
} from "@/lib/budgets/types";
import { createClient } from "@/lib/supabase/server";

type BudgetRow = {
  id: string;
  category_id: string;
  amount: number | string;
  start_date: string;
  end_date: string | null;
};

type BudgetTransactionRow = {
  type:
    | "expense"
    | "transfer"
    | "investment_buy"
    | "investment_sell"
    | "debt_payment";
  category_id: string;
  amount: number | string;
  admin_fee_amount: number | string;
  admin_fee_category_id: string | null;
};

export async function ensureBudgetCategories() {
  const supabase = await createClient();
  const [{ error }, { error: adminFeeError }] = await Promise.all([
    supabase.rpc("ensure_budget_categories"),
    supabase.rpc("ensure_admin_fee_category"),
  ]);

  return { supabase, error: error ?? adminFeeError };
}

export async function getBudgetCategoryOptions() {
  const { supabase, error: setupError } = await ensureBudgetCategories();

  if (setupError) {
    return {
      categories: [] as BudgetCategoryOption[],
      error:
        setupError.code === "PGRST202" || setupError.code === "42883"
          ? "Migration Budget MVP belum diterapkan di Supabase."
          : "Kategori budget belum bisa disiapkan.",
    };
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id,name")
    .eq("transaction_type", "expense")
    .eq("is_active", true)
    .order("name");

  return {
    categories: (data ?? []) as BudgetCategoryOption[],
    error: error ? "Kategori budget belum bisa dimuat." : null,
  };
}

export async function getCurrentMonthBudgets() {
  const supabase = await createClient();
  const month = getJakartaMonthRange();
  const { data: budgetRows, error: budgetError } = await supabase
    .from("budgets")
    .select("id,category_id,amount,start_date,end_date")
    .eq("period", "monthly")
    .eq("is_active", true)
    .lt("start_date", month.nextMonthDate)
    .or(`end_date.is.null,end_date.gte.${month.startDate}`)
    .order("created_at");

  if (budgetError) {
    return {
      budgets: [] as BudgetProgressItem[],
      monthLabel: month.label,
      error: "Budget belum bisa dimuat.",
    };
  }

  const budgets = (budgetRows ?? []) as BudgetRow[];
  const categoryIds = [...new Set(budgets.map((budget) => budget.category_id))];

  if (categoryIds.length === 0) {
    return {
      budgets: [] as BudgetProgressItem[],
      monthLabel: month.label,
      error: null,
    };
  }

  const [{ data: categoryRows, error: categoryError }, expenseResult] =
    await Promise.all([
      supabase.from("categories").select("id,name").in("id", categoryIds),
      supabase
        .from("transactions")
        .select(
          "type,category_id,amount,admin_fee_amount,admin_fee_category_id",
        )
        .in("type", [
          "expense",
          "transfer",
          "investment_buy",
          "investment_sell",
          "debt_payment",
        ])
        .gte("transaction_date", month.start)
        .lt("transaction_date", month.end),
    ]);

  if (categoryError || expenseResult.error) {
    return {
      budgets: [] as BudgetProgressItem[],
      monthLabel: month.label,
      error: "Progress budget belum bisa dihitung.",
    };
  }

  const categoryNames = new Map(
    (categoryRows ?? []).map((category) => [category.id, category.name]),
  );
  const spentByCategory = new Map<string, number>();

  for (const transaction of (expenseResult.data ??
    []) as BudgetTransactionRow[]) {
    if (
      transaction.type === "expense" &&
      categoryIds.includes(transaction.category_id)
    ) {
      spentByCategory.set(
        transaction.category_id,
        (spentByCategory.get(transaction.category_id) ?? 0) +
          Number(transaction.amount),
      );
    }

    if (
      transaction.admin_fee_category_id &&
      categoryIds.includes(transaction.admin_fee_category_id)
    ) {
      spentByCategory.set(
        transaction.admin_fee_category_id,
        (spentByCategory.get(transaction.admin_fee_category_id) ?? 0) +
          Number(transaction.admin_fee_amount),
      );
    }
  }

  return {
    budgets: budgets.map((budget) => {
      const amount = Number(budget.amount);
      const spent = spentByCategory.get(budget.category_id) ?? 0;
      const progressPercent = amount > 0 ? (spent / amount) * 100 : 0;

      return {
        id: budget.id,
        categoryId: budget.category_id,
        categoryName:
          categoryNames.get(budget.category_id) ?? "Kategori budget",
        amount,
        spent,
        remaining: amount - spent,
        progressPercent,
        startDate: budget.start_date,
        endDate: budget.end_date,
      };
    }),
    monthLabel: month.label,
    error: null,
  };
}

export async function getBudget(budgetId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("id,category_id,amount,start_date,end_date")
    .eq("id", budgetId)
    .eq("period", "monthly")
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  return {
    id: data.id,
    categoryId: data.category_id,
    amount: Number(data.amount),
    startDate: data.start_date,
    endDate: data.end_date,
  };
}

export async function getBudgetWarnings(): Promise<{
  warnings: BudgetWarning[];
  error: string | null;
}> {
  const result = await getCurrentMonthBudgets();

  return {
    warnings: selectBudgetWarnings(result.budgets),
    error: result.error,
  };
}

export function selectBudgetWarnings(
  budgets: BudgetProgressItem[],
): BudgetWarning[] {
  return [...budgets]
    .filter((budget) => budget.progressPercent >= 80)
    .sort((a, b) => b.progressPercent - a.progressPercent)
    .slice(0, 3);
}
