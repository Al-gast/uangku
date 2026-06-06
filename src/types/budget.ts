export type BudgetPeriod = "weekly" | "monthly";

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  period: BudgetPeriod;
  amount: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
