import "server-only";

import { createClient } from "@/lib/supabase/server";
import { spendableAccountTypes } from "@/constants/accounts";
import { mapTransactionRows } from "@/lib/cashflow/data";
import { getJakartaMonthRange } from "@/lib/date";
import type {
  AccountDetailResult,
  AccountMutationDateRange,
  AccountMutationFilters,
  AccountMovementSummary,
  AccountMutationItem,
  SettingsAccountItem,
} from "@/lib/accounts/types";
import {
  accountMutationDateRanges,
  accountMutationTypeFilters,
} from "@/lib/accounts/types";
import type {
  CashflowTransactionItem,
  ManualTransactionType,
} from "@/lib/cashflow/types";
import type { ReconciliationStatus } from "@/types/transaction";

type AccountRow = {
  id: string;
  name: string;
  type: SettingsAccountItem["type"];
  initial_balance: number | string;
  current_balance: number | string;
  is_active: boolean;
  created_at: string;
};

type TransactionCountRow = {
  account_id: string;
  transfer_to_account_id: string | null;
};

type AccountTransactionRow = {
  id: string;
  source: CashflowTransactionItem["source"];
  reconciliation_status?: ReconciliationStatus | null;
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

export const accountTransactionLimit = 120;

const emptySummary: AccountMovementSummary = {
  totalIn: 0,
  totalOut: 0,
  income: 0,
  expense: 0,
  transferIn: 0,
  transferOut: 0,
  otherIn: 0,
  otherOut: 0,
  adminFees: 0,
  netMovement: 0,
  transactionCount: 0,
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getJakartaDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(now);
}

function shiftDate(date: string, days: number) {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function getDateBounds(range: AccountMutationDateRange) {
  if (range === "all") {
    return null;
  }

  if (range === "this_month") {
    const month = getJakartaMonthRange();
    return { start: month.start, end: month.end };
  }

  const today = getJakartaDate();
  const startDate = shiftDate(today, -29);
  const endDate = shiftDate(today, 1);

  return {
    start: new Date(`${startDate}T00:00:00+07:00`).toISOString(),
    end: new Date(`${endDate}T00:00:00+07:00`).toISOString(),
  };
}

export function parseAccountMutationFilters(
  params: Record<string, string | string[] | undefined>,
): AccountMutationFilters {
  const range = firstParam(params.range);
  const type = firstParam(params.type);

  return {
    range: accountMutationDateRanges.includes(
      range as AccountMutationDateRange,
    )
      ? (range as AccountMutationDateRange)
      : "this_month",
    type: accountMutationTypeFilters.includes(
      type as AccountMutationFilters["type"],
    )
      ? (type as AccountMutationFilters["type"])
      : "all",
  };
}

export function countActiveAccountMutationFilters(
  filters: AccountMutationFilters,
) {
  return [
    filters.range === "this_month" ? null : filters.range,
    filters.type === "all" ? null : filters.type,
  ].filter(Boolean).length;
}

function toSettingsAccountItem(
  account: AccountRow,
  transactionCount = 0,
): SettingsAccountItem {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    initialBalance: Number(account.initial_balance),
    currentBalance: Number(account.current_balance),
    isActive: account.is_active,
    transactionCount,
    createdAt: account.created_at,
  };
}

function accountBalanceEffect(
  transaction: CashflowTransactionItem,
  accountId: string,
) {
  const isSourceAccount = transaction.accountId === accountId;
  const isDestinationAccount = transaction.transferToAccountId === accountId;
  const fee = isSourceAccount ? transaction.adminFeeAmount : 0;

  if (transaction.type === "income") {
    return transaction.amount;
  }

  if (transaction.type === "expense") {
    return -transaction.amount;
  }

  if (transaction.type === "transfer") {
    return isDestinationAccount
      ? transaction.amount
      : -(transaction.amount + fee);
  }

  if (transaction.type === "investment_sell") {
    return transaction.amount - fee;
  }

  return -(transaction.amount + fee);
}

function accountMutationTitle(
  transaction: CashflowTransactionItem,
  accountId: string,
) {
  const isDestinationAccount = transaction.transferToAccountId === accountId;

  if (transaction.type === "transfer") {
    return isDestinationAccount
      ? `Transfer dari ${transaction.accountName}`
      : `Transfer ke ${transaction.destinationAccountName ?? "akun tujuan"}`;
  }

  if (transaction.type === "investment_buy") {
    return `Top up ${transaction.assetName ?? "investasi"}`;
  }

  if (transaction.type === "investment_sell") {
    return `Tarik ${transaction.assetName ?? "investasi"}`;
  }

  if (transaction.type === "debt_payment") {
    return `Bayar ${transaction.liabilityName ?? "hutang"}`;
  }

  return transaction.merchant || transaction.categoryName;
}

function accountMutationSubtitle(
  transaction: CashflowTransactionItem,
  accountId: string,
) {
  if (transaction.type === "transfer") {
    return transaction.transferToAccountId === accountId
      ? `${transaction.accountName} -> ${transaction.categoryName}`
      : `${transaction.destinationAccountName ?? "Akun tujuan"} -> ${
          transaction.categoryName
        }`;
  }

  if (transaction.type === "investment_buy") {
    return `${transaction.accountName} -> ${
      transaction.assetName ?? "Aset"
    }`;
  }

  if (transaction.type === "investment_sell") {
    return `${transaction.assetName ?? "Aset"} -> ${
      transaction.accountName
    }`;
  }

  if (transaction.type === "debt_payment") {
    return `${transaction.accountName} -> ${
      transaction.liabilityName ?? "Hutang"
    }`;
  }

  return transaction.categoryName;
}

function toAccountMutation(
  transaction: CashflowTransactionItem,
  accountId: string,
): AccountMutationItem {
  const balanceEffect = accountBalanceEffect(transaction, accountId);

  return {
    id: transaction.id,
    source: transaction.source,
    reconciliationStatus: transaction.reconciliationStatus,
    type: transaction.type,
    amount: transaction.amount,
    adminFeeAmount: transaction.adminFeeAmount,
    adminFeeCategoryName: transaction.adminFeeCategoryName,
    transactionDate: transaction.transactionDate,
    merchant: transaction.merchant,
    notes: transaction.notes,
    accountId: transaction.accountId,
    accountName: transaction.accountName,
    transferToAccountId: transaction.transferToAccountId,
    destinationAccountName: transaction.destinationAccountName,
    assetName: transaction.assetName,
    liabilityName: transaction.liabilityName,
    categoryName: transaction.categoryName,
    direction: balanceEffect >= 0 ? "in" : "out",
    balanceEffect,
    title: accountMutationTitle(transaction, accountId),
    subtitle: accountMutationSubtitle(transaction, accountId),
  };
}

function summarizeAccountMutations(
  transactions: AccountMutationItem[],
  accountId: string,
): AccountMovementSummary {
  return transactions.reduce<AccountMovementSummary>(
    (summary, transaction) => {
      const absEffect = Math.abs(transaction.balanceEffect);

      if (transaction.balanceEffect >= 0) {
        summary.totalIn += transaction.balanceEffect;
      } else {
        summary.totalOut += absEffect;
      }

      if (transaction.type === "income") {
        summary.income += transaction.amount;
      } else if (transaction.type === "expense") {
        summary.expense += transaction.amount;
      } else if (transaction.type === "transfer") {
        if (transaction.transferToAccountId === accountId) {
          summary.transferIn += transaction.amount;
        } else {
          summary.transferOut += transaction.amount;
        }
      } else if (transaction.balanceEffect >= 0) {
        summary.otherIn += absEffect;
      } else {
        summary.otherOut += absEffect;
      }

      if (transaction.accountId === accountId) {
        summary.adminFees += transaction.adminFeeAmount;
      }

      summary.netMovement += transaction.balanceEffect;
      summary.transactionCount += 1;

      return summary;
    },
    { ...emptySummary },
  );
}

export async function getSettingsAccounts(): Promise<{
  accounts: SettingsAccountItem[];
  error: string | null;
}> {
  const supabase = await createClient();
  const [accountResult, transactionResult] = await Promise.all([
    supabase
      .from("accounts")
      .select(
        "id,name,type,initial_balance,current_balance,is_active,created_at",
      )
      .in("type", spendableAccountTypes)
      .order("is_active", { ascending: false })
      .order("created_at"),
    supabase
      .from("transactions")
      .select("account_id,transfer_to_account_id"),
  ]);

  if (accountResult.error || transactionResult.error) {
    return {
      accounts: [],
      error: "Akun belum bisa dimuat.",
    };
  }

  const transactionCounts = new Map<string, number>();

  for (const transaction of
    (transactionResult.data ?? []) as TransactionCountRow[]) {
    transactionCounts.set(
      transaction.account_id,
      (transactionCounts.get(transaction.account_id) ?? 0) + 1,
    );

    if (transaction.transfer_to_account_id) {
      transactionCounts.set(
        transaction.transfer_to_account_id,
        (transactionCounts.get(transaction.transfer_to_account_id) ?? 0) + 1,
      );
    }
  }

  return {
    accounts: ((accountResult.data ?? []) as AccountRow[]).map((account) =>
      toSettingsAccountItem(
        account,
        transactionCounts.get(account.id) ?? 0,
      ),
    ),
    error: null,
  };
}

export async function getAccountDetail(
  accountId: string,
  filters: AccountMutationFilters = { range: "this_month", type: "all" },
): Promise<AccountDetailResult> {
  const supabase = await createClient();
  let transactionQuery = supabase
    .from("transactions")
    .select(
      "id,source,reconciliation_status,type,amount,admin_fee_amount,admin_fee_category_id,transaction_date,merchant,notes,account_id,transfer_to_account_id,asset_id,liability_id,category_id",
    )
    .in("type", [
      "income",
      "expense",
      "transfer",
      "investment_buy",
      "investment_sell",
      "debt_payment",
    ])
    .in("source", ["manual", "chat"])
    .or(`account_id.eq.${accountId},transfer_to_account_id.eq.${accountId}`)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(accountTransactionLimit);
  const dateBounds = getDateBounds(filters.range);

  if (filters.type !== "all") {
    transactionQuery = transactionQuery.eq("type", filters.type);
  }

  if (dateBounds) {
    transactionQuery = transactionQuery
      .gte("transaction_date", dateBounds.start)
      .lt("transaction_date", dateBounds.end);
  }

  const [accountResult, transactionResult] = await Promise.all([
    supabase
      .from("accounts")
      .select(
        "id,name,type,initial_balance,current_balance,is_active,created_at",
      )
      .eq("id", accountId)
      .in("type", spendableAccountTypes)
      .maybeSingle(),
    transactionQuery,
  ]);

  if (accountResult.error) {
    return {
      account: null,
      transactions: [],
      summary: { ...emptySummary },
      error: "Akun belum bisa dimuat.",
    };
  }

  if (!accountResult.data) {
    return {
      account: null,
      transactions: [],
      summary: { ...emptySummary },
      error: null,
    };
  }

  if (transactionResult.error) {
    return {
      account: toSettingsAccountItem(accountResult.data as AccountRow),
      transactions: [],
      summary: { ...emptySummary },
      error: "Riwayat akun belum bisa dimuat.",
    };
  }

  const transactions = (
    await mapTransactionRows(
      (transactionResult.data ?? []) as AccountTransactionRow[],
    )
  ).map((transaction) => toAccountMutation(transaction, accountId));

  return {
    account: toSettingsAccountItem(
      accountResult.data as AccountRow,
      transactions.length,
    ),
    transactions,
    summary: summarizeAccountMutations(transactions, accountId),
    error: null,
  };
}
