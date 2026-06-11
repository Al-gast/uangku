export type InsightSeverity = "good" | "info" | "warning" | "danger";

export type InsightRecommendation = {
  id: string;
  severity: InsightSeverity;
  title: string;
  body: string;
  privacyBody?: string;
  actionHref?: string;
  actionLabel?: string;
};

export type TopExpenseCategory = {
  categoryId: string;
  categoryName: string;
  spent: number;
  sharePercent: number;
};

export type BudgetHealthStatus = "normal" | "warning" | "overbudget";

export type BudgetHealthItem = {
  id: string;
  categoryName: string;
  amount: number;
  spent: number;
  remaining: number;
  progressPercent: number;
  status: BudgetHealthStatus;
};

export type InvestmentActivity = {
  buyTotal: number;
  sellTotal: number;
  netFlow: number;
  feeTotal: number;
};

export type AdminFeeSource = "transfer" | "investment" | "debt";

export type AdminFeeBreakdownItem = {
  source: AdminFeeSource;
  label: string;
  amount: number;
  sharePercent: number;
};

export type DebtActivity = {
  principalPaid: number;
  feeTotal: number;
  totalPaid: number;
  paymentToIncomeRatio: number | null;
  activeLiabilityCount: number;
  remainingAmount: number;
  status: "none" | "safe" | "watch" | "heavy";
};

export type MonthlyTrendDirection =
  | "increase"
  | "decrease"
  | "flat"
  | "new";

export type MonthlyMetricComparison = {
  current: number;
  previous: number;
  delta: number;
  percentChange: number | null;
  direction: MonthlyTrendDirection;
};

export type SavingRateComparison = {
  current: number | null;
  previous: number | null;
  deltaPoints: number | null;
  direction: MonthlyTrendDirection | "unavailable";
};

export type ExpenseCategoryIncrease = {
  categoryId: string;
  categoryName: string;
  currentSpent: number;
  previousSpent: number;
  delta: number;
  percentChange: number | null;
  isNew: boolean;
};

export type MonthlyComparison = {
  previousMonthLabel: string;
  hasPreviousTransactions: boolean;
  income: MonthlyMetricComparison;
  expense: MonthlyMetricComparison;
  savingRate: SavingRateComparison;
  debtPayments: MonthlyMetricComparison;
  adminFees: MonthlyMetricComparison;
  categoryIncreases: ExpenseCategoryIncrease[];
};

export type ProjectedBudgetRisk = {
  id: string;
  categoryName: string;
  budgetAmount: number;
  currentSpent: number;
  projectedSpent: number;
  projectedProgressPercent: number;
  projectedOverrun: number;
};

export type MonthlyProjection = {
  available: boolean;
  elapsedDays: number;
  totalDays: number;
  dailyExpenseAverage: number;
  projectedExpense: number;
  projectedNetCashflow: number;
  projectedSavingRate: number | null;
  confidence: "early" | "developing" | "stable";
  budgetRisks: ProjectedBudgetRisk[];
};

export type MonthlyReviewData = {
  monthKey: string;
  monthLabel: string;
  previousMonthKey: string;
  nextMonthKey: string;
  isCurrentMonth: boolean;
  hasMonthlyTransactions: boolean;
  monthlyIncome: number;
  monthlyExpense: number;
  netCashflow: number;
  savingRate: number | null;
  adminFeeTotal: number;
  adminFeeBreakdown: AdminFeeBreakdownItem[];
  topExpenseCategories: TopExpenseCategory[];
  budgetHealth: BudgetHealthItem[];
  investmentActivity: InvestmentActivity;
  debtActivity: DebtActivity;
  comparison: MonthlyComparison;
  projection: MonthlyProjection;
  recommendations: InsightRecommendation[];
  error: string | null;
};
