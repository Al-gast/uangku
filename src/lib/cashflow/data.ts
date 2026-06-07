import "server-only";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  CashflowAccountOption,
  CashflowAssetOption,
  CashflowCategoryOption,
  CashflowTransactionItem,
  ManualTransactionType,
} from "@/lib/cashflow/types";

type TransactionRow = {
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
  category_id: string;
};

export async function ensureManualCashflowCategories() {
  const supabase = await createClient();
  const [{ error }, { error: adminFeeError }] = await Promise.all([
    supabase.rpc("ensure_manual_cashflow_categories"),
    supabase.rpc("ensure_admin_fee_category"),
  ]);

  return { supabase, error: error ?? adminFeeError };
}

export async function getCashflowFormOptions() {
  const supabase = await createClient();
  const [setupResult, adminFeeResult, accountResult, assetResult] =
    await Promise.all([
      supabase.rpc("ensure_manual_cashflow_categories"),
      supabase.rpc("ensure_admin_fee_category"),
      supabase
        .from("accounts")
        .select("id,name,current_balance")
        .eq("is_active", true)
        .in("type", ["cash", "bank_account", "e_wallet"])
        .order("created_at"),
      supabase
        .from("assets")
        .select("id,name,current_value")
        .in("type", ["rdpu", "rdpt", "gold", "crypto", "stock", "other_asset"])
        .order("created_at"),
    ]);
  const categorySetupError = setupResult.error ?? adminFeeResult.error;

  if (categorySetupError) {
    return {
      accounts: [] as CashflowAccountOption[],
      assets: [] as CashflowAssetOption[],
      categories: [] as CashflowCategoryOption[],
      setupError:
        categorySetupError.code === "PGRST202" ||
        categorySetupError.code === "42883"
          ? "Migration manual cashflow belum diterapkan di Supabase."
          : "Kategori transaksi belum bisa disiapkan.",
    };
  }

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("id,name,transaction_type")
    .in("transaction_type", ["income", "expense", "transfer", "investment"])
    .eq("is_active", true)
    .order("name");
  const accountRows = accountResult.data;
  const assetRows = assetResult.data;

  return {
    accounts: (accountRows ?? []).map((account) => ({
      id: account.id,
      name: account.name,
      currentBalance: Number(account.current_balance),
    })),
    assets: (assetRows ?? []).map((asset) => ({
      id: asset.id,
      name: asset.name,
      currentValue: Number(asset.current_value),
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
  const categoryIds = [
    ...new Set(
      rows.flatMap((row) =>
        [row.category_id, row.admin_fee_category_id].filter(
          (id): id is string => Boolean(id),
        ),
      ),
    ),
  ];
  const assetIds = [
    ...new Set(
      rows
        .map((row) => row.asset_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [
    { data: accountRows },
    { data: categoryRows },
    { data: assetRows },
  ] = await Promise.all([
    accountIds.length
      ? supabase.from("accounts").select("id,name").in("id", accountIds)
      : Promise.resolve({ data: [] }),
    categoryIds.length
      ? supabase.from("categories").select("id,name").in("id", categoryIds)
      : Promise.resolve({ data: [] }),
    assetIds.length
      ? supabase.from("assets").select("id,name").in("id", assetIds)
      : Promise.resolve({ data: [] }),
  ]);

  const accountNames = new Map(
    (accountRows ?? []).map((account) => [account.id, account.name]),
  );
  const categoryNames = new Map(
    (categoryRows ?? []).map((category) => [category.id, category.name]),
  );
  const assetNames = new Map(
    (assetRows ?? []).map((asset) => [asset.id, asset.name]),
  );

  return rows.map((row) => ({
    id: row.id,
    source: row.source,
    type: row.type,
    amount: Number(row.amount),
    adminFeeAmount: Number(row.admin_fee_amount),
    adminFeeCategoryId: row.admin_fee_category_id,
    adminFeeCategoryName: row.admin_fee_category_id
      ? (categoryNames.get(row.admin_fee_category_id) ?? "Biaya Admin")
      : null,
    transactionDate: row.transaction_date,
    merchant: row.merchant,
    notes: row.notes,
    accountId: row.account_id,
    accountName: accountNames.get(row.account_id) ?? "Akun",
    transferToAccountId: row.transfer_to_account_id,
    destinationAccountName: row.transfer_to_account_id
      ? (accountNames.get(row.transfer_to_account_id) ?? "Akun")
      : null,
    assetId: row.asset_id,
    assetName: row.asset_id ? (assetNames.get(row.asset_id) ?? "Aset") : null,
    categoryId: row.category_id,
    categoryName: categoryNames.get(row.category_id) ?? "Kategori",
  }));
}

export async function getCashflowTransactions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id,source,type,amount,admin_fee_amount,admin_fee_category_id,transaction_date,merchant,notes,account_id,transfer_to_account_id,asset_id,category_id",
    )
    .in("type", [
      "income",
      "expense",
      "transfer",
      "investment_buy",
      "investment_sell",
    ])
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

export async function getCashflowTransaction(transactionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id,source,type,amount,admin_fee_amount,admin_fee_category_id,transaction_date,merchant,notes,account_id,transfer_to_account_id,asset_id,category_id",
    )
    .eq("id", transactionId)
    .in("type", [
      "income",
      "expense",
      "transfer",
      "investment_buy",
      "investment_sell",
    ])
    .in("source", ["manual", "chat"])
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const [transaction] = await mapTransactionRows([
    data as TransactionRow,
  ]);

  return transaction;
}
