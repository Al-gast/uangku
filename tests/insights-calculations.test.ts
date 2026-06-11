import { strict as assert } from "node:assert";
import {
  buildMonthlyComparison,
  buildMonthlyProjection,
  buildMonthlyReviewCalculations,
  collectMonthlyReviewCategoryIds,
  type InsightBudgetProgressRow,
  type InsightLiabilityRow,
  type InsightTransactionRow,
} from "../src/lib/insights/calculations";
import {
  getJakartaMonthRange,
  resolveJakartaMonthRange,
} from "../src/lib/date";
import {
  addRecommendationActions,
  buildCashflowDrilldownHref,
} from "../src/lib/insights/links";
import { buildInsightRecommendations } from "../src/lib/insights/recommendations";

const categoryNames = new Map([
  ["category-makan", "Makan"],
  ["category-admin", "Biaya Admin"],
  ["category-gaji", "Gaji"],
]);

const budgets: InsightBudgetProgressRow[] = [
  {
    id: "budget-normal",
    categoryName: "Transport",
    amount: 1_000_000,
    spent: 500_000,
    remaining: 500_000,
    progressPercent: 50,
  },
  {
    id: "budget-warning",
    categoryName: "Makan",
    amount: 2_000_000,
    spent: 1_700_000,
    remaining: 300_000,
    progressPercent: 85,
  },
  {
    id: "budget-over",
    categoryName: "Lifestyle",
    amount: 1_000_000,
    spent: 1_200_000,
    remaining: -200_000,
    progressPercent: 120,
  },
];

const liabilities: InsightLiabilityRow[] = [
  { id: "liability-hp", remaining_amount: 4_500_000 },
  { id: "liability-laptop", remaining_amount: "2000000" },
];

const transactions: InsightTransactionRow[] = [
  {
    type: "income",
    amount: 10_000_000,
    admin_fee_amount: 0,
    category_id: "category-gaji",
    admin_fee_category_id: null,
  },
  {
    type: "expense",
    amount: 2_000_000,
    admin_fee_amount: 0,
    category_id: "category-makan",
    admin_fee_category_id: null,
  },
  {
    type: "transfer",
    amount: 5_000_000,
    admin_fee_amount: 6_500,
    category_id: null,
    admin_fee_category_id: "category-admin",
  },
  {
    type: "investment_buy",
    amount: 1_500_000,
    admin_fee_amount: 2_500,
    category_id: null,
    admin_fee_category_id: "category-admin",
  },
  {
    type: "investment_sell",
    amount: 500_000,
    admin_fee_amount: 1_000,
    category_id: null,
    admin_fee_category_id: "category-admin",
  },
  {
    type: "debt_payment",
    amount: 1_200_000,
    admin_fee_amount: 50_000,
    category_id: null,
    admin_fee_category_id: "category-admin",
  },
];

function buildReview() {
  return buildMonthlyReviewCalculations({
    transactions,
    categoryNames,
    budgets,
    liabilities,
  });
}

function runMonthlyReviewCalculationTests() {
  const review = buildReview();

  assert.deepEqual(collectMonthlyReviewCategoryIds(transactions), [
    "category-gaji",
    "category-makan",
    "category-admin",
  ]);

  assert.equal(review.monthlyIncome, 10_000_000);
  assert.equal(review.monthlyExpense, 2_060_000);
  assert.equal(review.adminFeeTotal, 60_000);
  assert.deepEqual(
    review.adminFeeBreakdown.map((item) => ({
      source: item.source,
      amount: item.amount,
    })),
    [
      { source: "debt", amount: 50_000 },
      { source: "transfer", amount: 6_500 },
      { source: "investment", amount: 3_500 },
    ],
  );
  assert.equal(review.netCashflow, 7_940_000);
  assert.equal(review.savingRate, 79.4);

  assert.deepEqual(
    review.topExpenseCategories.map((category) => ({
      name: category.categoryName,
      spent: category.spent,
    })),
    [
      { name: "Makan", spent: 2_000_000 },
      { name: "Biaya Admin", spent: 60_000 },
    ],
  );
  assert.equal(
    Math.round(review.topExpenseCategories[0].sharePercent),
    97,
  );

  assert.equal(review.investmentActivity.buyTotal, 1_500_000);
  assert.equal(review.investmentActivity.sellTotal, 500_000);
  assert.equal(review.investmentActivity.netFlow, 1_000_000);
  assert.equal(review.investmentActivity.feeTotal, 3_500);

  assert.equal(review.debtActivity.principalPaid, 1_200_000);
  assert.equal(review.debtActivity.feeTotal, 50_000);
  assert.equal(review.debtActivity.totalPaid, 1_250_000);
  assert.equal(review.debtActivity.paymentToIncomeRatio, 12.5);
  assert.equal(review.debtActivity.remainingAmount, 6_500_000);
  assert.equal(review.debtActivity.activeLiabilityCount, 2);
  assert.equal(review.debtActivity.status, "safe");

  assert.deepEqual(
    review.budgetHealth.map((budget) => ({
      id: budget.id,
      status: budget.status,
    })),
    [
      { id: "budget-over", status: "overbudget" },
      { id: "budget-warning", status: "warning" },
      { id: "budget-normal", status: "normal" },
    ],
  );
}

function runDebtBurdenRecommendationTests() {
  const review = buildMonthlyReviewCalculations({
    transactions: [
      {
        type: "income",
        amount: 4_000_000,
        admin_fee_amount: 0,
        category_id: "category-gaji",
        admin_fee_category_id: null,
      },
      {
        type: "debt_payment",
        amount: 2_000_000,
        admin_fee_amount: 100_000,
        category_id: null,
        admin_fee_category_id: "category-admin",
      },
    ],
    categoryNames,
    budgets: [],
    liabilities: [{ id: "liability-heavy", remaining_amount: 8_000_000 }],
  });
  const recommendations = buildInsightRecommendations({
    hasMonthlyTransactions: true,
    monthlyIncome: review.monthlyIncome,
    monthlyExpense: review.monthlyExpense,
    savingRate: review.savingRate,
    adminFeeTotal: review.adminFeeTotal,
    adminFeeBreakdown: review.adminFeeBreakdown,
    topExpenseCategories: review.topExpenseCategories,
    budgetHealth: review.budgetHealth,
    investmentActivity: review.investmentActivity,
    debtActivity: review.debtActivity,
    projection: buildMonthlyProjection({
      calculations: review,
      elapsedDays: 30,
      totalDays: 30,
      isCurrentMonth: false,
      hasTransactions: true,
    }),
  });

  assert.equal(review.debtActivity.status, "heavy");
  assert.ok(
    recommendations.some(
      (recommendation) => recommendation.id === "heavy-debt-burden",
    ),
  );
  assert.match(
    recommendations.find(
      (recommendation) => recommendation.id === "heavy-debt-burden",
    )?.body ?? "",
    /53% pemasukan/,
  );
}

function runMonthRangeTests() {
  const now = new Date("2026-06-11T03:00:00.000Z");
  const current = getJakartaMonthRange(now);

  assert.equal(current.key, "2026-06");
  assert.equal(current.start, "2026-05-31T17:00:00.000Z");
  assert.equal(current.end, "2026-06-30T17:00:00.000Z");
  assert.equal(current.previousKey, "2026-05");
  assert.equal(current.nextKey, "2026-07");
  assert.equal(current.isCurrentMonth, true);

  const historical = resolveJakartaMonthRange("2025-12", now);
  assert.equal(historical.key, "2025-12");
  assert.equal(historical.previousKey, "2025-11");
  assert.equal(historical.nextKey, "2026-01");
  assert.equal(historical.startDate, "2025-12-01");
  assert.equal(historical.nextMonthDate, "2026-01-01");
  assert.equal(historical.isCurrentMonth, false);

  assert.equal(resolveJakartaMonthRange("invalid", now).key, "2026-06");
  assert.equal(resolveJakartaMonthRange("2026-13", now).key, "2026-06");
  assert.equal(resolveJakartaMonthRange("2026-07", now).key, "2026-06");
}

function runDrilldownLinkTests() {
  assert.equal(
    buildCashflowDrilldownHref({
      monthKey: "2026-05",
      categoryId: "category-makan",
    }),
    "/cashflow?month=2026-05&category=category-makan",
  );
  assert.equal(
    buildCashflowDrilldownHref({
      monthKey: "2026-05",
      type: "debt_payment",
    }),
    "/cashflow?month=2026-05&type=debt_payment",
  );

  const actions = addRecommendationActions(
    [
      {
        id: "high-admin-fee",
        severity: "info",
        title: "Biaya admin",
        body: "Periksa biaya admin.",
      },
      {
        id: "heavy-debt-burden",
        severity: "danger",
        title: "Cicilan berat",
        body: "Periksa pembayaran hutang.",
      },
      {
        id: "positive-investment-activity",
        severity: "good",
        title: "Investasi bertambah",
        body: "Lihat portfolio.",
      },
      {
        id: "overbudget",
        severity: "danger",
        title: "Budget lewat",
        body: "Lihat budget.",
      },
    ],
    {
      monthKey: "2026-05",
      topExpenseCategories: [
        {
          categoryId: "category-admin",
          categoryName: "Biaya Admin",
          spent: 60_000,
          sharePercent: 3,
        },
      ],
    },
  );

  assert.equal(
    actions.find((item) => item.id === "high-admin-fee")?.actionHref,
    "/cashflow?month=2026-05&category=category-admin",
  );
  assert.equal(
    actions.find((item) => item.id === "heavy-debt-burden")?.actionHref,
    "/cashflow?month=2026-05&type=debt_payment",
  );
  assert.equal(
    actions.find((item) => item.id === "positive-investment-activity")
      ?.actionHref,
    "/portfolio",
  );
  assert.equal(
    actions.find((item) => item.id === "overbudget")?.actionHref,
    "/settings/budgets",
  );
}

function runMonthlyComparisonTests() {
  const current = buildReview();
  const previous = buildMonthlyReviewCalculations({
    transactions: [
      {
        type: "income",
        amount: 8_000_000,
        admin_fee_amount: 0,
        category_id: "category-gaji",
        admin_fee_category_id: null,
      },
      {
        type: "expense",
        amount: 1_000_000,
        admin_fee_amount: 0,
        category_id: "category-makan",
        admin_fee_category_id: null,
      },
      {
        type: "transfer",
        amount: 2_000_000,
        admin_fee_amount: 20_000,
        category_id: null,
        admin_fee_category_id: "category-admin",
      },
      {
        type: "debt_payment",
        amount: 500_000,
        admin_fee_amount: 10_000,
        category_id: null,
        admin_fee_category_id: "category-admin",
      },
    ],
    categoryNames,
    budgets: [],
    liabilities: [],
  });
  const comparison = buildMonthlyComparison({
    current,
    previous,
    previousMonthLabel: "Mei 2026",
    hasPreviousTransactions: true,
  });

  assert.equal(comparison.previousMonthLabel, "Mei 2026");
  assert.equal(comparison.income.direction, "increase");
  assert.equal(comparison.income.percentChange, 25);
  assert.equal(comparison.expense.direction, "increase");
  assert.equal(comparison.expense.percentChange, 100);
  assert.equal(comparison.savingRate.direction, "decrease");
  assert.ok(
    Math.abs((comparison.savingRate.deltaPoints ?? 0) - -7.725) < 0.001,
  );
  assert.equal(comparison.debtPayments.previous, 510_000);
  assert.equal(comparison.debtPayments.current, 1_250_000);
  assert.equal(comparison.adminFees.previous, 30_000);
  assert.equal(comparison.adminFees.current, 60_000);
  assert.deepEqual(
    comparison.categoryIncreases.map((category) => ({
      name: category.categoryName,
      delta: category.delta,
      isNew: category.isNew,
    })),
    [
      { name: "Makan", delta: 1_000_000, isNew: false },
      { name: "Biaya Admin", delta: 30_000, isNew: false },
    ],
  );

  const noBaseline = buildMonthlyComparison({
    current,
    previous: buildMonthlyReviewCalculations({
      transactions: [],
      categoryNames,
      budgets: [],
      liabilities: [],
    }),
    previousMonthLabel: "April 2026",
    hasPreviousTransactions: false,
  });
  assert.equal(noBaseline.hasPreviousTransactions, false);
  assert.equal(noBaseline.income.direction, "new");
}

function runMonthlyProjectionTests() {
  const review = buildReview();
  const projection = buildMonthlyProjection({
    calculations: review,
    elapsedDays: 10,
    totalDays: 30,
    isCurrentMonth: true,
    hasTransactions: true,
  });

  assert.equal(projection.available, true);
  assert.equal(projection.dailyExpenseAverage, 206_000);
  assert.equal(projection.projectedExpense, 6_180_000);
  assert.equal(projection.projectedNetCashflow, 3_820_000);
  assert.equal(projection.projectedSavingRate, 38.2);
  assert.equal(projection.confidence, "developing");
  assert.deepEqual(
    projection.budgetRisks.map((budget) => ({
      id: budget.id,
      projectedSpent: budget.projectedSpent,
      projectedOverrun: budget.projectedOverrun,
    })),
    [
      {
        id: "budget-over",
        projectedSpent: 3_600_000,
        projectedOverrun: 2_600_000,
      },
      {
        id: "budget-warning",
        projectedSpent: 5_100_000,
        projectedOverrun: 3_100_000,
      },
      {
        id: "budget-normal",
        projectedSpent: 1_500_000,
        projectedOverrun: 500_000,
      },
    ],
  );

  const historical = buildMonthlyProjection({
    calculations: review,
    elapsedDays: 31,
    totalDays: 31,
    isCurrentMonth: false,
    hasTransactions: true,
  });
  assert.equal(historical.available, false);
  assert.equal(historical.budgetRisks.length, 0);

  const riskyReview = buildMonthlyReviewCalculations({
    transactions: [
      {
        type: "income",
        amount: 1_000_000,
        admin_fee_amount: 0,
        category_id: "category-gaji",
        admin_fee_category_id: null,
      },
      {
        type: "expense",
        amount: 800_000,
        admin_fee_amount: 0,
        category_id: "category-makan",
        admin_fee_category_id: null,
      },
    ],
    categoryNames,
    budgets: [],
    liabilities: [],
  });
  const riskyProjection = buildMonthlyProjection({
    calculations: riskyReview,
    elapsedDays: 10,
    totalDays: 30,
    isCurrentMonth: true,
    hasTransactions: true,
  });
  const recommendations = buildInsightRecommendations({
    hasMonthlyTransactions: true,
    monthlyIncome: riskyReview.monthlyIncome,
    monthlyExpense: riskyReview.monthlyExpense,
    savingRate: riskyReview.savingRate,
    adminFeeTotal: riskyReview.adminFeeTotal,
    adminFeeBreakdown: riskyReview.adminFeeBreakdown,
    topExpenseCategories: riskyReview.topExpenseCategories,
    budgetHealth: riskyReview.budgetHealth,
    investmentActivity: riskyReview.investmentActivity,
    debtActivity: riskyReview.debtActivity,
    projection: riskyProjection,
  });

  assert.ok(
    recommendations.some(
      (recommendation) =>
        recommendation.id === "projected-negative-cashflow",
    ),
  );
}

function runActionableRecommendationTests() {
  const lowSavingReview = buildMonthlyReviewCalculations({
    transactions: [
      {
        type: "income",
        amount: 5_000_000,
        admin_fee_amount: 0,
        category_id: "category-gaji",
        admin_fee_category_id: null,
      },
      {
        type: "expense",
        amount: 4_700_000,
        admin_fee_amount: 0,
        category_id: "category-makan",
        admin_fee_category_id: null,
      },
      {
        type: "transfer",
        amount: 1_000_000,
        admin_fee_amount: 100_000,
        category_id: null,
        admin_fee_category_id: "category-admin",
      },
    ],
    categoryNames,
    budgets: [
      {
        id: "budget-makan",
        categoryName: "Makan",
        amount: 2_000_000,
        spent: 1_700_000,
        remaining: 300_000,
        progressPercent: 85,
      },
    ],
    liabilities: [],
  });
  const projection = buildMonthlyProjection({
    calculations: lowSavingReview,
    elapsedDays: 20,
    totalDays: 30,
    isCurrentMonth: true,
    hasTransactions: true,
  });
  const recommendations = buildInsightRecommendations({
    hasMonthlyTransactions: true,
    monthlyIncome: lowSavingReview.monthlyIncome,
    monthlyExpense: lowSavingReview.monthlyExpense,
    savingRate: lowSavingReview.savingRate,
    adminFeeTotal: lowSavingReview.adminFeeTotal,
    adminFeeBreakdown: lowSavingReview.adminFeeBreakdown,
    topExpenseCategories: lowSavingReview.topExpenseCategories,
    budgetHealth: lowSavingReview.budgetHealth,
    investmentActivity: lowSavingReview.investmentActivity,
    debtActivity: lowSavingReview.debtActivity,
    projection,
  });

  assert.match(
    recommendations.find(
      (recommendation) => recommendation.id === "low-saving-rate",
    )?.body ?? "",
    /Rp\s*800\.000/,
  );
  assert.match(
    recommendations.find(
      (recommendation) => recommendation.id === "near-budget-limit",
    )?.body ?? "",
    /Rp\s*300\.000 untuk 10 hari tersisa.*Rp\s*30\.000 per hari/,
  );
  assert.match(
    recommendations.find(
      (recommendation) => recommendation.id === "high-admin-fee",
    )?.body ?? "",
    /transfer, sebesar Rp\s*100\.000 \(100%\)/,
  );

  const belowTargetReview = buildMonthlyReviewCalculations({
    transactions: [
      {
        type: "income",
        amount: 10_000_000,
        admin_fee_amount: 0,
        category_id: "category-gaji",
        admin_fee_category_id: null,
      },
      {
        type: "expense",
        amount: 8_500_000,
        admin_fee_amount: 0,
        category_id: "category-makan",
        admin_fee_category_id: null,
      },
    ],
    categoryNames,
    budgets: [],
    liabilities: [],
  });
  const belowTargetRecommendations = buildInsightRecommendations({
    hasMonthlyTransactions: true,
    monthlyIncome: belowTargetReview.monthlyIncome,
    monthlyExpense: belowTargetReview.monthlyExpense,
    savingRate: belowTargetReview.savingRate,
    adminFeeTotal: belowTargetReview.adminFeeTotal,
    adminFeeBreakdown: belowTargetReview.adminFeeBreakdown,
    topExpenseCategories: belowTargetReview.topExpenseCategories,
    budgetHealth: belowTargetReview.budgetHealth,
    investmentActivity: belowTargetReview.investmentActivity,
    debtActivity: belowTargetReview.debtActivity,
    projection: buildMonthlyProjection({
      calculations: belowTargetReview,
      elapsedDays: 30,
      totalDays: 30,
      isCurrentMonth: false,
      hasTransactions: true,
    }),
  });

  assert.equal(belowTargetReview.savingRate, 15);
  assert.match(
    belowTargetRecommendations.find(
      (recommendation) => recommendation.id === "low-saving-rate",
    )?.body ?? "",
    /Rp\s*500\.000.*target 20%/,
  );
}

runMonthlyReviewCalculationTests();
runDebtBurdenRecommendationTests();
runMonthRangeTests();
runDrilldownLinkTests();
runMonthlyComparisonTests();
runMonthlyProjectionTests();
runActionableRecommendationTests();
console.log("Monthly review calculation tests passed.");
