export type BudgetCategoryOption = {
  id: string;
  name: string;
};

export type BudgetProgressItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  spent: number;
  remaining: number;
  progressPercent: number;
  startDate: string;
  endDate: string | null;
};

export type BudgetWarning = Pick<
  BudgetProgressItem,
  "id" | "categoryName" | "remaining" | "progressPercent"
>;
