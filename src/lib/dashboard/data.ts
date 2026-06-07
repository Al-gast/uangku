import "server-only";

import { mapTransactionRows } from "@/lib/cashflow/data";
import type {
  CashflowTransactionItem,
  ManualTransactionType,
} from "@/lib/cashflow/types";
import { getJakartaMonthRange } from "@/lib/date";
import type { DashboardAccount, DashboardData } from "@/lib/dashboard/types";
import { createClient } from "@/lib/supabase/server";

type MonthlyTransactionRow = {
  type: ManualTransactionType;
  amount: number | string;
};

type RecentTransactionRow = {
  id: string;
  source: CashflowTransactionItem["source"];
  type: ManualTransactionType;
  amount: number | string;
  transaction_date: string;
  merchant: string | null;
  notes: string | null;
  account_id: string;
  transfer_to_account_id: string | null;
  category_id: string;
};

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const month = getJakartaMonthRange();

  const [profileResult, monthlyResult, accountResult, recentResult] =
    await Promise.all([
      supabase.from("profiles").select("full_name").maybeSingle(),
      supabase
        .from("transactions")
        .select("type,amount")
        .in("type", ["income", "expense", "transfer"])
        .gte("transaction_date", month.start)
        .lt("transaction_date", month.end),
      supabase
        .from("accounts")
        .select("id,name,type,current_balance")
        .eq("is_active", true)
        .in("type", ["cash", "bank_account", "e_wallet"])
        .order("created_at"),
      supabase
        .from("transactions")
        .select(
          "id,source,type,amount,transaction_date,merchant,notes,account_id,transfer_to_account_id,category_id",
        )
        .in("type", ["income", "expense", "transfer"])
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const monthlyRows = (monthlyResult.data ?? []) as MonthlyTransactionRow[];
  const monthlyIncome = monthlyRows
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
  const monthlyExpense = monthlyRows
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const accounts: DashboardAccount[] = (accountResult.data ?? []).map(
    (account) => ({
      id: account.id,
      name: account.name,
      type: account.type as DashboardAccount["type"],
      currentBalance: Number(account.current_balance),
    }),
  );

  let recentTransactions: CashflowTransactionItem[] = [];
  let recentMappingFailed = false;

  try {
    recentTransactions = recentResult.error
      ? []
      : await mapTransactionRows(
          (recentResult.data ?? []) as RecentTransactionRow[],
        );
  } catch {
    recentMappingFailed = true;
  }

  return {
    monthLabel: month.label,
    profileName: profileResult.data?.full_name?.trim() || null,
    monthlyIncome,
    monthlyExpense,
    hasMonthlyTransactions: monthlyRows.length > 0,
    accounts,
    recentTransactions,
    dashboardError:
      monthlyResult.error || recentResult.error || recentMappingFailed
        ? "Data dashboard belum bisa dimuat."
        : null,
    accountError: accountResult.error
      ? "Saldo akun belum bisa dimuat."
      : null,
  };
}
