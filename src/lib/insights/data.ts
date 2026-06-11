import "server-only";

import { getMonthlyBudgets } from "@/lib/budgets/data";
import {
  getJakartaMonthProgress,
  resolveJakartaMonthRange,
} from "@/lib/date";
import {
  buildMonthlyComparison,
  buildMonthlyProjection,
  buildMonthlyReviewCalculations,
  collectMonthlyReviewCategoryIds,
  INSIGHT_TRANSACTION_TYPES,
  type InsightLiabilityRow,
  type InsightTransactionRow,
} from "@/lib/insights/calculations";
import { addRecommendationActions } from "@/lib/insights/links";
import { buildInsightRecommendations } from "@/lib/insights/recommendations";
import type { MonthlyReviewData } from "@/lib/insights/types";
import { createClient } from "@/lib/supabase/server";

type CategoryRow = {
  id: string;
  name: string;
};

export async function getMonthlyReviewData(
  monthKey?: string | null,
): Promise<MonthlyReviewData> {
  const supabase = await createClient();
  const month = resolveJakartaMonthRange(monthKey);
  const previousMonth = resolveJakartaMonthRange(month.previousKey);

  const [
    transactionResult,
    previousTransactionResult,
    liabilityResult,
    budgetResult,
  ] = await Promise.all([
    getInsightTransactions(supabase, month.start, month.end),
    getInsightTransactions(supabase, previousMonth.start, previousMonth.end),
    supabase
      .from("liabilities")
      .select("id,remaining_amount")
      .gt("remaining_amount", 0),
    getMonthlyBudgets(month),
  ]);

  const transactions = (transactionResult.data ?? []) as InsightTransactionRow[];
  const previousTransactions = (previousTransactionResult.data ??
    []) as InsightTransactionRow[];
  const liabilities = (liabilityResult.data ?? []) as InsightLiabilityRow[];
  const categoryIds = [
    ...new Set([
      ...collectMonthlyReviewCategoryIds(transactions),
      ...collectMonthlyReviewCategoryIds(previousTransactions),
    ]),
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

  const calculations = buildMonthlyReviewCalculations({
    transactions,
    categoryNames,
    budgets: budgetResult.budgets,
    liabilities,
  });
  const previousCalculations = buildMonthlyReviewCalculations({
    transactions: previousTransactions,
    categoryNames,
    budgets: [],
    liabilities: [],
  });
  const comparison = buildMonthlyComparison({
    current: calculations,
    previous: previousCalculations,
    previousMonthLabel: previousMonth.label,
    hasPreviousTransactions: previousTransactions.length > 0,
  });
  const monthProgress = getJakartaMonthProgress(month);
  const projection = buildMonthlyProjection({
    calculations,
    elapsedDays: monthProgress.elapsedDays,
    totalDays: monthProgress.totalDays,
    isCurrentMonth: month.isCurrentMonth,
    hasTransactions: transactions.length > 0,
  });

  const recommendations = addRecommendationActions(
    buildInsightRecommendations({
      hasMonthlyTransactions: transactions.length > 0,
      monthlyIncome: calculations.monthlyIncome,
      monthlyExpense: calculations.monthlyExpense,
      savingRate: calculations.savingRate,
      adminFeeTotal: calculations.adminFeeTotal,
      adminFeeBreakdown: calculations.adminFeeBreakdown,
      topExpenseCategories: calculations.topExpenseCategories,
      budgetHealth: calculations.budgetHealth,
      investmentActivity: calculations.investmentActivity,
      debtActivity: calculations.debtActivity,
      projection,
    }),
    {
      monthKey: month.key,
      topExpenseCategories: calculations.topExpenseCategories,
    },
  );

  return {
    monthKey: month.key,
    monthLabel: month.label,
    previousMonthKey: month.previousKey,
    nextMonthKey: month.nextKey,
    isCurrentMonth: month.isCurrentMonth,
    hasMonthlyTransactions: transactions.length > 0,
    monthlyIncome: calculations.monthlyIncome,
    monthlyExpense: calculations.monthlyExpense,
    netCashflow: calculations.netCashflow,
    savingRate: calculations.savingRate,
    adminFeeTotal: calculations.adminFeeTotal,
    adminFeeBreakdown: calculations.adminFeeBreakdown,
    topExpenseCategories: calculations.topExpenseCategories,
    budgetHealth: calculations.budgetHealth,
    investmentActivity: calculations.investmentActivity,
    debtActivity: calculations.debtActivity,
    comparison,
    projection,
    recommendations,
    error:
      transactionResult.error ||
      previousTransactionResult.error ||
      categoryResult.error ||
      budgetResult.error ||
      liabilityResult.error
        ? "Insight bulan ini belum bisa dimuat lengkap."
        : null,
  };
}

function getInsightTransactions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  start: string,
  end: string,
) {
  return supabase
    .from("transactions")
    .select("type,amount,admin_fee_amount,category_id,admin_fee_category_id")
    .in("type", INSIGHT_TRANSACTION_TYPES)
    .gte("transaction_date", start)
    .lt("transaction_date", end);
}
