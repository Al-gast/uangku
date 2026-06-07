import "server-only";

import { createClient } from "@/lib/supabase/server";
import { spendableAccountTypes } from "@/constants/accounts";
import type { SettingsAccountItem } from "@/lib/accounts/types";

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
    accounts: ((accountResult.data ?? []) as AccountRow[]).map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      initialBalance: Number(account.initial_balance),
      currentBalance: Number(account.current_balance),
      isActive: account.is_active,
      transactionCount: transactionCounts.get(account.id) ?? 0,
      createdAt: account.created_at,
    })),
    error: null,
  };
}
