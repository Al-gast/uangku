export type InsightSeverity = "good" | "info" | "warning" | "danger";

export type InsightRecommendation = {
  id: string;
  severity: InsightSeverity;
  title: string;
  body: string;
  privacyBody?: string;
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

export type DebtActivity = {
  principalPaid: number;
  feeTotal: number;
};

export type MonthlyReviewData = {
  monthLabel: string;
  hasMonthlyTransactions: boolean;
  monthlyIncome: number;
  monthlyExpense: number;
  netCashflow: number;
  savingRate: number | null;
  adminFeeTotal: number;
  topExpenseCategories: TopExpenseCategory[];
  budgetHealth: BudgetHealthItem[];
  investmentActivity: InvestmentActivity;
  debtActivity: DebtActivity;
  recommendations: InsightRecommendation[];
  error: string | null;
};
