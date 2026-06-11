import type {
  AdminFeeBreakdownItem,
  BudgetHealthItem,
  BudgetHealthStatus,
  DebtActivity,
  MonthlyComparison,
  MonthlyMetricComparison,
  MonthlyProjection,
  MonthlyTrendDirection,
  InvestmentActivity,
  SavingRateComparison,
  TopExpenseCategory,
} from "@/lib/insights/types";

export type InsightTransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "investment_buy"
  | "investment_sell"
  | "debt_payment";

export type InsightTransactionRow = {
  type: InsightTransactionType;
  amount: number | string;
  admin_fee_amount: number | string | null;
  category_id: string | null;
  admin_fee_category_id: string | null;
};

export type InsightLiabilityRow = {
  id: string;
  remaining_amount: number | string;
};

export type InsightBudgetProgressRow = {
  id: string;
  categoryName: string;
  amount: number;
  spent: number;
  remaining: number;
  progressPercent: number;
};

export const INSIGHT_TRANSACTION_TYPES: InsightTransactionType[] = [
  "income",
  "expense",
  "transfer",
  "investment_buy",
  "investment_sell",
  "debt_payment",
];

export function collectMonthlyReviewCategoryIds(
  transactions: InsightTransactionRow[],
) {
  return [
    ...new Set(
      transactions
        .flatMap((transaction) => [
          transaction.category_id,
          transaction.admin_fee_category_id,
        ])
        .filter((categoryId): categoryId is string => Boolean(categoryId)),
    ),
  ];
}

export function buildMonthlyReviewCalculations({
  transactions,
  categoryNames,
  budgets,
  liabilities,
}: {
  transactions: InsightTransactionRow[];
  categoryNames: Map<string, string>;
  budgets: InsightBudgetProgressRow[];
  liabilities: InsightLiabilityRow[];
}) {
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
  const expenseCategories = buildExpenseCategories(
    transactions,
    categoryNames,
    monthlyExpense,
  );

  return {
    monthlyIncome,
    monthlyExpense,
    netCashflow,
    savingRate,
    adminFeeTotal,
    adminFeeBreakdown: buildAdminFeeBreakdown(
      transactions,
      adminFeeTotal,
    ),
    expenseCategories,
    topExpenseCategories: expenseCategories.slice(0, 5),
    budgetHealth: buildBudgetHealth(budgets),
    investmentActivity: buildInvestmentActivity(transactions),
    debtActivity: buildDebtActivity(transactions, liabilities, monthlyIncome),
  };
}

function buildAdminFeeBreakdown(
  transactions: InsightTransactionRow[],
  adminFeeTotal: number,
): AdminFeeBreakdownItem[] {
  const amounts = new Map<AdminFeeBreakdownItem["source"], number>([
    ["transfer", 0],
    ["investment", 0],
    ["debt", 0],
  ]);

  for (const transaction of transactions) {
    const fee = Number(transaction.admin_fee_amount ?? 0);

    if (fee <= 0) {
      continue;
    }

    if (transaction.type === "transfer") {
      amounts.set("transfer", (amounts.get("transfer") ?? 0) + fee);
    } else if (
      transaction.type === "investment_buy" ||
      transaction.type === "investment_sell"
    ) {
      amounts.set("investment", (amounts.get("investment") ?? 0) + fee);
    } else if (transaction.type === "debt_payment") {
      amounts.set("debt", (amounts.get("debt") ?? 0) + fee);
    }
  }

  const labels: Record<AdminFeeBreakdownItem["source"], string> = {
    transfer: "transfer",
    investment: "investasi",
    debt: "hutang/cicilan",
  };

  return [...amounts.entries()]
    .filter(([, amount]) => amount > 0)
    .map(([source, amount]) => ({
      source,
      label: labels[source],
      amount,
      sharePercent: adminFeeTotal > 0 ? (amount / adminFeeTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label));
}

export function buildMonthlyComparison({
  current,
  previous,
  previousMonthLabel,
  hasPreviousTransactions,
}: {
  current: ReturnType<typeof buildMonthlyReviewCalculations>;
  previous: ReturnType<typeof buildMonthlyReviewCalculations>;
  previousMonthLabel: string;
  hasPreviousTransactions: boolean;
}): MonthlyComparison {
  return {
    previousMonthLabel,
    hasPreviousTransactions,
    income: compareMetric(current.monthlyIncome, previous.monthlyIncome),
    expense: compareMetric(current.monthlyExpense, previous.monthlyExpense),
    savingRate: compareSavingRate(
      current.savingRate,
      previous.savingRate,
    ),
    debtPayments: compareMetric(
      current.debtActivity.totalPaid,
      previous.debtActivity.totalPaid,
    ),
    adminFees: compareMetric(
      current.adminFeeTotal,
      previous.adminFeeTotal,
    ),
    categoryIncreases: buildCategoryIncreases(
      current.expenseCategories,
      previous.expenseCategories,
    ),
  };
}

export function buildMonthlyProjection({
  calculations,
  elapsedDays,
  totalDays,
  isCurrentMonth,
  hasTransactions,
}: {
  calculations: ReturnType<typeof buildMonthlyReviewCalculations>;
  elapsedDays: number;
  totalDays: number;
  isCurrentMonth: boolean;
  hasTransactions: boolean;
}): MonthlyProjection {
  const available =
    isCurrentMonth &&
    hasTransactions &&
    elapsedDays > 0 &&
    totalDays >= elapsedDays;
  const dailyExpenseAverage = available
    ? calculations.monthlyExpense / elapsedDays
    : 0;
  const projectedExpense = available
    ? dailyExpenseAverage * totalDays
    : calculations.monthlyExpense;
  const projectedNetCashflow =
    calculations.monthlyIncome - projectedExpense;
  const projectedSavingRate =
    calculations.monthlyIncome > 0
      ? (projectedNetCashflow / calculations.monthlyIncome) * 100
      : null;
  const confidence =
    elapsedDays <= 7
      ? "early"
      : elapsedDays <= 14
        ? "developing"
        : "stable";

  return {
    available,
    elapsedDays,
    totalDays,
    dailyExpenseAverage,
    projectedExpense,
    projectedNetCashflow,
    projectedSavingRate,
    confidence,
    budgetRisks: available
      ? calculations.budgetHealth
          .map((budget) => {
            const projectedSpent = (budget.spent / elapsedDays) * totalDays;
            const projectedProgressPercent =
              budget.amount > 0
                ? (projectedSpent / budget.amount) * 100
                : 0;

            return {
              id: budget.id,
              categoryName: budget.categoryName,
              budgetAmount: budget.amount,
              currentSpent: budget.spent,
              projectedSpent,
              projectedProgressPercent,
              projectedOverrun: Math.max(0, projectedSpent - budget.amount),
            };
          })
          .filter((budget) => budget.projectedProgressPercent > 100)
          .sort(
            (a, b) =>
              b.projectedProgressPercent - a.projectedProgressPercent ||
              a.categoryName.localeCompare(b.categoryName),
          )
          .slice(0, 5)
      : [],
  };
}

function compareMetric(
  current: number,
  previous: number,
): MonthlyMetricComparison {
  const delta = current - previous;
  const direction: MonthlyTrendDirection =
    previous === 0 && current > 0
      ? "new"
      : delta > 0
        ? "increase"
        : delta < 0
          ? "decrease"
          : "flat";

  return {
    current,
    previous,
    delta,
    percentChange:
      previous > 0 ? (delta / previous) * 100 : null,
    direction,
  };
}

function compareSavingRate(
  current: number | null,
  previous: number | null,
): SavingRateComparison {
  if (current === null || previous === null) {
    return {
      current,
      previous,
      deltaPoints: null,
      direction: "unavailable",
    };
  }

  const deltaPoints = current - previous;

  return {
    current,
    previous,
    deltaPoints,
    direction:
      deltaPoints > 0
        ? "increase"
        : deltaPoints < 0
          ? "decrease"
          : "flat",
  };
}

function buildCategoryIncreases(
  current: TopExpenseCategory[],
  previous: TopExpenseCategory[],
) {
  const previousSpent = new Map(
    previous.map((category) => [category.categoryId, category.spent]),
  );

  return current
    .map((category) => {
      const previousValue = previousSpent.get(category.categoryId) ?? 0;
      const delta = category.spent - previousValue;

      return {
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        currentSpent: category.spent,
        previousSpent: previousValue,
        delta,
        percentChange:
          previousValue > 0 ? (delta / previousValue) * 100 : null,
        isNew: previousValue === 0 && category.spent > 0,
      };
    })
    .filter((category) => category.delta > 0)
    .sort(
      (a, b) =>
        b.delta - a.delta ||
        a.categoryName.localeCompare(b.categoryName),
    )
    .slice(0, 3);
}

function buildExpenseCategories(
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
    .sort(
      (a, b) =>
        b.spent - a.spent || a.categoryName.localeCompare(b.categoryName),
    );
}

function buildBudgetHealth(
  budgets: InsightBudgetProgressRow[],
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

function buildInvestmentActivity(
  transactions: InsightTransactionRow[],
): InvestmentActivity {
  const buyTotal = sumAmountByType(transactions, "investment_buy");
  const sellTotal = sumAmountByType(transactions, "investment_sell");

  return {
    buyTotal,
    sellTotal,
    netFlow: buyTotal - sellTotal,
    feeTotal: transactions.reduce(
      (total, transaction) =>
        transaction.type === "investment_buy" ||
        transaction.type === "investment_sell"
          ? total + Number(transaction.admin_fee_amount ?? 0)
          : total,
      0,
    ),
  };
}

function buildDebtActivity(
  transactions: InsightTransactionRow[],
  liabilities: InsightLiabilityRow[],
  monthlyIncome: number,
): DebtActivity {
  const principalPaid = sumAmountByType(transactions, "debt_payment");
  const feeTotal = transactions.reduce(
    (total, transaction) =>
      transaction.type === "debt_payment"
        ? total + Number(transaction.admin_fee_amount ?? 0)
        : total,
    0,
  );
  const totalPaid = principalPaid + feeTotal;
  const paymentToIncomeRatio =
    monthlyIncome > 0 ? (totalPaid / monthlyIncome) * 100 : null;
  const remainingAmount = liabilities.reduce(
    (total, liability) => total + Number(liability.remaining_amount),
    0,
  );
  const status =
    totalPaid === 0 && remainingAmount === 0
      ? "none"
      : paymentToIncomeRatio !== null && paymentToIncomeRatio >= 50
        ? "heavy"
        : paymentToIncomeRatio !== null && paymentToIncomeRatio >= 30
          ? "watch"
          : "safe";

  return {
    principalPaid,
    feeTotal,
    totalPaid,
    paymentToIncomeRatio,
    activeLiabilityCount: liabilities.length,
    remainingAmount,
    status,
  };
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
