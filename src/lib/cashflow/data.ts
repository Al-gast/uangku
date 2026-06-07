import "server-only";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  CashflowAccountOption,
  CashflowCategoryOption,
  CashflowTransactionItem,
  ManualTransactionType,
} from "@/lib/cashflow/types";

type TransactionRow = {
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

export async function ensureManualCashflowCategories() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ensure_manual_cashflow_categories");

  return { supabase, error };
}

export async function getCashflowFormOptions() {
  const { supabase, error: categorySetupError } =
    await ensureManualCashflowCategories();

  if (categorySetupError) {
    return {
      accounts: [] as CashflowAccountOption[],
      categories: [] as CashflowCategoryOption[],
      setupError:
        categorySetupError.code === "PGRST202" ||
        categorySetupError.code === "42883"
          ? "Migration manual cashflow belum diterapkan di Supabase."
          : "Kategori transaksi belum bisa disiapkan.",
    };
  }

  const [{ data: accountRows }, { data: categoryRows }] = await Promise.all([
    supabase
      .from("accounts")
      .select("id,name,current_balance")
      .eq("is_active", true)
      .order("created_at"),
    supabase
      .from("categories")
      .select("id,name,transaction_type")
      .in("transaction_type", ["income", "expense", "transfer"])
      .eq("is_active", true)
      .order("name"),
  ]);

  return {
    accounts: (accountRows ?? []).map((account) => ({
      id: account.id,
      name: account.name,
      currentBalance: Number(account.current_balance),
    })),
    categories: (categoryRows ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      transactionType:
        category.transaction_type as CashflowCategoryOption["transactionType"],
    })),
    setupError: null,
  };
}

export async function mapTransactionRows(
  rows: TransactionRow[],
): Promise<CashflowTransactionItem[]> {
  const supabase = await createClient();
  const accountIds = [
    ...new Set(
      rows.flatMap((row) =>
        [row.account_id, row.transfer_to_account_id].filter(
          (id): id is string => Boolean(id),
        ),
      ),
    ),
  ];
  const categoryIds = [...new Set(rows.map((row) => row.category_id))];

  const [{ data: accountRows }, { data: categoryRows }] = await Promise.all([
    accountIds.length
      ? supabase.from("accounts").select("id,name").in("id", accountIds)
      : Promise.resolve({ data: [] }),
    categoryIds.length
      ? supabase.from("categories").select("id,name").in("id", categoryIds)
      : Promise.resolve({ data: [] }),
  ]);

  const accountNames = new Map(
    (accountRows ?? []).map((account) => [account.id, account.name]),
  );
  const categoryNames = new Map(
    (categoryRows ?? []).map((category) => [category.id, category.name]),
  );

  return rows.map((row) => ({
    id: row.id,
    source: row.source,
    type: row.type,
    amount: Number(row.amount),
    transactionDate: row.transaction_date,
    merchant: row.merchant,
    notes: row.notes,
    accountId: row.account_id,
    accountName: accountNames.get(row.account_id) ?? "Akun",
    transferToAccountId: row.transfer_to_account_id,
    destinationAccountName: row.transfer_to_account_id
      ? (accountNames.get(row.transfer_to_account_id) ?? "Akun")
      : null,
    categoryId: row.category_id,
    categoryName: categoryNames.get(row.category_id) ?? "Kategori",
  }));
}

export async function getCashflowTransactions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id,source,type,amount,transaction_date,merchant,notes,account_id,transfer_to_account_id,category_id",
    )
    .in("type", ["income", "expense", "transfer"])
    .in("source", ["manual", "chat"])
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return {
      transactions: [] as CashflowTransactionItem[],
      error: "Transaksi belum bisa dimuat.",
    };
  }

  return {
    transactions: await mapTransactionRows(
      (data ?? []) as TransactionRow[],
    ),
    error: null,
  };
}

export async function getManualTransaction(transactionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id,source,type,amount,transaction_date,merchant,notes,account_id,transfer_to_account_id,category_id",
    )
    .eq("id", transactionId)
    .in("type", ["income", "expense", "transfer"])
    .eq("source", "manual")
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const [transaction] = await mapTransactionRows([
    data as TransactionRow,
  ]);

  return transaction;
}
