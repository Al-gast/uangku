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
  admin_fee_amount: number | string;
};

type MonthlySummaryRow = {
  monthly_income: number | string;
  monthly_expense: number | string;
  transaction_count: number | string;
};

type RecentTransactionRow = {
  id: string;
  source: CashflowTransactionItem["source"];
  type: ManualTransactionType;
  amount: number | string;
  admin_fee_amount: number | string;
  admin_fee_category_id: string | null;
  transaction_date: string;
  merchant: string | null;
  notes: string | null;
  account_id: string;
  transfer_to_account_id: string | null;
  asset_id: string | null;
  liability_id: string | null;
  category_id: string;
};

type DashboardMonthlySummary = {
  monthlyIncome: number;
  monthlyExpense: number;
  hasMonthlyTransactions: boolean;
  error: string | null;
};

async function getFallbackMonthlySummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  month: ReturnType<typeof getJakartaMonthRange>,
): Promise<DashboardMonthlySummary> {
  const { data, error } = await supabase
    .from("transactions")
    .select("type,amount,admin_fee_amount")
    .in("type", [
      "income",
      "expense",
      "transfer",
      "investment_buy",
      "investment_sell",
      "debt_payment",
    ])
    .gte("transaction_date", month.start)
    .lt("transaction_date", month.end);
  const rows = (data ?? []) as MonthlyTransactionRow[];

  return {
    monthlyIncome: rows
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + Number(transaction.amount), 0),
    monthlyExpense: rows.reduce(
      (total, transaction) =>
        total +
        (transaction.type === "expense" ? Number(transaction.amount) : 0) +
        Number(transaction.admin_fee_amount),
      0,
    ),
    hasMonthlyTransactions: rows.length > 0,
    error: error ? "Data dashboard belum bisa dimuat." : null,
  };
}

async function getMonthlyDashboardSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  month: ReturnType<typeof getJakartaMonthRange>,
): Promise<DashboardMonthlySummary> {
  const { data, error } = await supabase
    .rpc("get_dashboard_monthly_summary", {
      p_start: month.start,
      p_end: month.end,
    })
    .maybeSingle();

  if (error || !data) {
    return getFallbackMonthlySummary(supabase, month);
  }

  const summary = data as MonthlySummaryRow;

  return {
    monthlyIncome: Number(summary.monthly_income),
    monthlyExpense: Number(summary.monthly_expense),
    hasMonthlyTransactions: Number(summary.transaction_count) > 0,
    error: null,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const month = getJakartaMonthRange();

  const [profileResult, monthlySummary, accountResult, recentResult] =
    await Promise.all([
      supabase.from("profiles").select("full_name").maybeSingle(),
      getMonthlyDashboardSummary(supabase, month),
      supabase
        .from("accounts")
        .select("id,name,type,current_balance")
        .eq("is_active", true)
        .in("type", ["cash", "bank_account", "e_wallet"])
        .order("created_at"),
      supabase
        .from("transactions")
        .select(
          "id,source,type,amount,admin_fee_amount,admin_fee_category_id,transaction_date,merchant,notes,account_id,transfer_to_account_id,asset_id,liability_id,category_id",
        )
        .in("type", [
          "income",
          "expense",
          "transfer",
          "investment_buy",
          "investment_sell",
          "debt_payment",
        ])
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

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
    monthlyIncome: monthlySummary.monthlyIncome,
    monthlyExpense: monthlySummary.monthlyExpense,
    hasMonthlyTransactions: monthlySummary.hasMonthlyTransactions,
    accounts,
    recentTransactions,
    dashboardError:
      monthlySummary.error || recentResult.error || recentMappingFailed
        ? "Data dashboard belum bisa dimuat."
        : null,
    accountError: accountResult.error
      ? "Saldo akun belum bisa dimuat."
      : null,
  };
}
