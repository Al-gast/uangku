import type { AccountType } from "@/types/account";
import type { CashflowTransactionItem } from "@/lib/cashflow/types";

export type DashboardAccount = {
  id: string;
  name: string;
  type: Extract<AccountType, "cash" | "bank_account" | "e_wallet">;
  currentBalance: number;
};

export type DashboardData = {
  monthLabel: string;
  profileName: string | null;
  monthlyIncome: number;
  monthlyExpense: number;
  hasMonthlyTransactions: boolean;
  accounts: DashboardAccount[];
  recentTransactions: CashflowTransactionItem[];
  dashboardError: string | null;
  accountError: string | null;
};
