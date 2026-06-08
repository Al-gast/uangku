import "server-only";

import { getCurrentMonthBudgets } from "@/lib/budgets/data";
import { getJakartaMonthRange } from "@/lib/date";
import { buildInsightRecommendations } from "@/lib/insights/recommendations";
import type {
  BudgetHealthItem,
  BudgetHealthStatus,
  MonthlyReviewData,
  TopExpenseCategory,
} from "@/lib/insights/types";
import { createClient } from "@/lib/supabase/server";

type InsightTransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "investment_buy"
  | "investment_sell"
  | "debt_payment";

type InsightTransactionRow = {
  type: InsightTransactionType;
  amount: number | string;
  admin_fee_amount: number | string | null;
  category_id: string | null;
  admin_fee_category_id: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
};

const INSIGHT_TRANSACTION_TYPES: InsightTransactionType[] = [
  "income",
  "expense",
  "transfer",
  "investment_buy",
  "investment_sell",
  "debt_payment",
];

export async function getMonthlyReviewData(): Promise<MonthlyReviewData> {
  const supabase = await createClient();
  const month = getJakartaMonthRange();

  const [transactionResult, budgetResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("type,amount,admin_fee_amount,category_id,admin_fee_category_id")
      .in("type", INSIGHT_TRANSACTION_TYPES)
      .gte("transaction_date", month.start)
      .lt("transaction_date", month.end),
    getCurrentMonthBudgets(),
  ]);

  const transactions = (transactionResult.data ?? []) as InsightTransactionRow[];
  const categoryIds = [
    ...new Set(
      transactions
        .flatMap((transaction) => [
          transaction.category_id,
          transaction.admin_fee_category_id,
        ])
        .filter((categoryId): categoryId is string => Boolean(categoryId)),
    ),
  ];

  const categoryResult =
    categoryIds.length > 0
      ? await supabase.from("categories").select("id,name").in("id", categoryIds)
      : { data: [] as CategoryRow[], error: null };

  const categoryNames = new Map(
    ((categoryResult.data ?? []) as CategoryRow[]).map((category) => [
      category.id,
      category.name,
    ]),
  );

  const monthlyIncome = transactions.reduce(
    (total, transaction) =>
      transaction.type === "income" ? total + Number(transaction.amount) : total,
    0,
  );

  const monthlyExpense = transactions.reduce((total, transaction) => {
    const normalExpense =
      transaction.type === "expense" ? Number(transaction.amount) : 0;
    const adminFee = Number(transaction.admin_fee_amount ?? 0);

    return total + normalExpense + adminFee;
  }, 0);

  const netCashflow = monthlyIncome - monthlyExpense;
  const savingRate =
    monthlyIncome > 0 ? (netCashflow / monthlyIncome) * 100 : null;
  const adminFeeTotal = transactions.reduce(
    (total, transaction) => total + Number(transaction.admin_fee_amount ?? 0),
    0,
  );

  const topExpenseCategories = buildTopExpenseCategories(
    transactions,
    categoryNames,
    monthlyExpense,
  );
  const budgetHealth = buildBudgetHealth(budgetResult.budgets);
  const investmentActivity = {
    buyTotal: sumAmountByType(transactions, "investment_buy"),
    sellTotal: sumAmountByType(transactions, "investment_sell"),
    netFlow:
      sumAmountByType(transactions, "investment_buy") -
      sumAmountByType(transactions, "investment_sell"),
    feeTotal: transactions.reduce(
      (total, transaction) =>
        transaction.type === "investment_buy" ||
        transaction.type === "investment_sell"
          ? total + Number(transaction.admin_fee_amount ?? 0)
          : total,
      0,
    ),
  };
  const debtActivity = {
    principalPaid: sumAmountByType(transactions, "debt_payment"),
    feeTotal: transactions.reduce(
      (total, transaction) =>
        transaction.type === "debt_payment"
          ? total + Number(transaction.admin_fee_amount ?? 0)
          : total,
      0,
    ),
  };

  const recommendations = buildInsightRecommendations({
    hasMonthlyTransactions: transactions.length > 0,
    monthlyIncome,
    monthlyExpense,
    savingRate,
    adminFeeTotal,
    topExpenseCategories,
    budgetHealth,
    investmentActivity,
    debtActivity,
  });

  return {
    monthLabel: month.label,
    hasMonthlyTransactions: transactions.length > 0,
    monthlyIncome,
    monthlyExpense,
    netCashflow,
    savingRate,
    adminFeeTotal,
    topExpenseCategories,
    budgetHealth,
    investmentActivity,
    debtActivity,
    recommendations,
    error:
      transactionResult.error || categoryResult.error || budgetResult.error
        ? "Insight bulan ini belum bisa dimuat lengkap."
        : null,
  };
}

function buildTopExpenseCategories(
  transactions: InsightTransactionRow[],
  categoryNames: Map<string, string>,
  monthlyExpense: number,
): TopExpenseCategory[] {
  const spentByCategory = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.type === "expense" && transaction.category_id) {
      spentByCategory.set(
        transaction.category_id,
        (spentByCategory.get(transaction.category_id) ?? 0) +
          Number(transaction.amount),
      );
    }

    if (
      transaction.admin_fee_category_id &&
      Number(transaction.admin_fee_amount ?? 0) > 0
    ) {
      spentByCategory.set(
        transaction.admin_fee_category_id,
        (spentByCategory.get(transaction.admin_fee_category_id) ?? 0) +
          Number(transaction.admin_fee_amount ?? 0),
      );
    }
  }

  return [...spentByCategory.entries()]
    .map(([categoryId, spent]) => ({
      categoryId,
      categoryName: categoryNames.get(categoryId) ?? "Kategori lainnya",
      spent,
      sharePercent: monthlyExpense > 0 ? (spent / monthlyExpense) * 100 : 0,
    }))
    .sort((a, b) => b.spent - a.spent || a.categoryName.localeCompare(b.categoryName))
    .slice(0, 5);
}

function buildBudgetHealth(
  budgets: {
    id: string;
    categoryName: string;
    amount: number;
    spent: number;
    remaining: number;
    progressPercent: number;
  }[],
): BudgetHealthItem[] {
  return budgets
    .map((budget) => {
      const status: BudgetHealthStatus =
        budget.progressPercent > 100
          ? "overbudget"
          : budget.progressPercent >= 80
            ? "warning"
            : "normal";

      return {
        id: budget.id,
        categoryName: budget.categoryName,
        amount: budget.amount,
        spent: budget.spent,
        remaining: budget.remaining,
        progressPercent: budget.progressPercent,
        status,
      };
    })
    .sort((a, b) => {
      const statusRank: Record<BudgetHealthStatus, number> = {
        overbudget: 0,
        warning: 1,
        normal: 2,
      };

      return (
        statusRank[a.status] - statusRank[b.status] ||
        b.progressPercent - a.progressPercent ||
        a.categoryName.localeCompare(b.categoryName)
      );
    });
}

function sumAmountByType(
  transactions: InsightTransactionRow[],
  type: InsightTransactionType,
) {
  return transactions.reduce(
    (total, transaction) =>
      transaction.type === type ? total + Number(transaction.amount) : total,
    0,
  );
}
