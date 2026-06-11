import "server-only";

import { notFound } from "next/navigation";
import { spendableAccountTypes } from "@/constants/accounts";
import {
  getJakartaMonthRange,
  resolveJakartaMonthRange,
} from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import type {
  CashflowAccountOption,
  CashflowAssetOption,
  CashflowCategoryOption,
  CashflowDateRange,
  CashflowFilterAccountOption,
  CashflowFilterCategoryOption,
  CashflowFilters,
  CashflowLiabilityOption,
  CashflowTransactionItem,
  ManualTransactionType,
} from "@/lib/cashflow/types";
import { cashflowDateRanges } from "@/lib/cashflow/types";

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
  liability_id: string | null;
  category_id: string;
};

const manualTransactionTypes: ManualTransactionType[] = [
  "income",
  "expense",
  "transfer",
  "investment_buy",
  "investment_sell",
  "debt_payment",
];
export const cashflowTransactionLimit = 80;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isManualTransactionType(
  value: string | undefined,
): value is ManualTransactionType {
  return manualTransactionTypes.includes(value as ManualTransactionType);
}

function isCashflowDateRange(
  value: string | undefined,
): value is CashflowDateRange {
  return cashflowDateRanges.includes(value as CashflowDateRange);
}

function isUuid(value: string | undefined) {
  return Boolean(value && uuidPattern.test(value));
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

function getDateBounds(
  range: CashflowDateRange,
  monthKey: string | null = null,
) {
  if (monthKey) {
    const month = resolveJakartaMonthRange(monthKey);
    return { start: month.start, end: month.end };
  }

  if (range === "all") {
    return null;
  }

  if (range === "this_month") {
    const month = getJakartaMonthRange();
    return { start: month.start, end: month.end };
  }

  const today = getJakartaDate();
  const daysAgo = range === "last_7_days" ? 6 : 29;
  const startDate = shiftDate(today, -daysAgo);
  const endDate = shiftDate(today, 1);

  return {
    start: new Date(`${startDate}T00:00:00+07:00`).toISOString(),
    end: new Date(`${endDate}T00:00:00+07:00`).toISOString(),
  };
}

export function parseCashflowFilters(
  params: Record<string, string | string[] | undefined>,
): CashflowFilters {
  const type = firstParam(params.type);
  const accountId = firstParam(params.account);
  const categoryId = firstParam(params.category);
  const source = firstParam(params.source);
  const range = firstParam(params.range);
  const requestedMonth = firstParam(params.month);
  const resolvedMonth = requestedMonth
    ? resolveJakartaMonthRange(requestedMonth)
    : null;
  const month =
    requestedMonth && resolvedMonth?.key === requestedMonth
      ? resolvedMonth
      : null;

  return {
    type: isManualTransactionType(type) ? type : null,
    accountId: isUuid(accountId) ? accountId! : null,
    categoryId: isUuid(categoryId) ? categoryId! : null,
    source: source === "manual" || source === "chat" ? source : null,
    range: isCashflowDateRange(range) ? range : "all",
    monthKey: month?.key ?? null,
    monthLabel: month?.label ?? null,
  };
}

export function countActiveCashflowFilters(filters: CashflowFilters) {
  return [
    filters.type,
    filters.accountId,
    filters.categoryId,
    filters.source,
    filters.range === "all" ? null : filters.range,
    filters.monthKey,
  ].filter(Boolean).length;
}

export async function ensureManualCashflowCategories() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ensure_default_categories");

  return { supabase, error };
}

export async function getCashflowFormOptions(includeCategoryId?: string) {
  const supabase = await createClient();
  const [
    setupResult,
    accountResult,
    assetResult,
    liabilityResult,
  ] = await Promise.all([
    supabase.rpc("ensure_default_categories"),
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
    supabase
      .from("liabilities")
      .select("id,name,remaining_amount")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at"),
  ]);
  const categorySetupError = setupResult.error;

  if (categorySetupError) {
    return {
      accounts: [] as CashflowAccountOption[],
      assets: [] as CashflowAssetOption[],
      liabilities: [] as CashflowLiabilityOption[],
      categories: [] as CashflowCategoryOption[],
      setupError:
        categorySetupError.code === "PGRST202" ||
        categorySetupError.code === "42883"
          ? "Migration manual cashflow belum diterapkan di Supabase."
          : "Kategori transaksi belum bisa disiapkan.",
    };
  }

  let categoryQuery = supabase
    .from("categories")
    .select("id,name,transaction_type")
    .in("transaction_type", [
      "income",
      "expense",
      "transfer",
      "investment",
      "debt",
    ])
    .order("sort_order")
    .order("name");

  categoryQuery = includeCategoryId
    ? categoryQuery.or(`is_active.eq.true,id.eq.${includeCategoryId}`)
    : categoryQuery.eq("is_active", true);

  const { data: categoryRows } = await categoryQuery;
  const accountRows = accountResult.data;
  const assetRows = assetResult.data;
  const liabilityRows = liabilityResult.data;

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
    liabilities: (liabilityRows ?? []).map((liability) => ({
      id: liability.id,
      name: liability.name,
      remainingAmount: Number(liability.remaining_amount),
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

export async function getCashflowFilterOptions() {
  const supabase = await createClient();
  const [accountResult, categoryResult] = await Promise.all([
    supabase
      .from("accounts")
      .select("id,name,is_active")
      .in("type", spendableAccountTypes)
      .order("is_active", { ascending: false })
      .order("sort_order")
      .order("name"),
    supabase
      .from("categories")
      .select("id,name,is_active")
      .in("transaction_type", [
        "income",
        "expense",
        "transfer",
        "investment",
        "debt",
      ])
      .order("is_active", { ascending: false })
      .order("sort_order")
      .order("name"),
  ]);

  return {
    accounts: (accountResult.data ?? []).map((account) => ({
      id: account.id,
      name: account.name,
      isActive: account.is_active,
    })) as CashflowFilterAccountOption[],
    categories: (categoryResult.data ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      isActive: category.is_active,
    })) as CashflowFilterCategoryOption[],
    error:
      accountResult.error || categoryResult.error
        ? "Pilihan filter belum bisa dimuat."
        : null,
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
  const liabilityIds = [
    ...new Set(
      rows
        .map((row) => row.liability_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [
    { data: accountRows },
    { data: categoryRows },
    { data: assetRows },
    { data: liabilityRows },
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
    liabilityIds.length
      ? supabase
          .from("liabilities")
          .select("id,name")
          .in("id", liabilityIds)
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
  const liabilityNames = new Map(
    (liabilityRows ?? []).map((liability) => [
      liability.id,
      liability.name,
    ]),
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
    liabilityId: row.liability_id,
    liabilityName: row.liability_id
      ? (liabilityNames.get(row.liability_id) ?? "Hutang")
      : null,
    categoryId: row.category_id,
    categoryName: categoryNames.get(row.category_id) ?? "Kategori",
  }));
}

export async function getCashflowTransactions(filters?: CashflowFilters) {
  const supabase = await createClient();
  let query = supabase
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
    .in("source", ["manual", "chat"])
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  if (filters?.source) {
    query = query.eq("source", filters.source);
  }

  if (filters?.accountId) {
    query = query.or(
      `account_id.eq.${filters.accountId},transfer_to_account_id.eq.${filters.accountId}`,
    );
  }

  if (filters?.categoryId) {
    query = query.or(
      `category_id.eq.${filters.categoryId},admin_fee_category_id.eq.${filters.categoryId}`,
    );
  }

  const dateBounds = getDateBounds(
    filters?.range ?? "all",
    filters?.monthKey ?? null,
  );

  if (dateBounds) {
    query = query
      .gte("transaction_date", dateBounds.start)
      .lt("transaction_date", dateBounds.end);
  }

  const { data, error } = await query.limit(cashflowTransactionLimit);

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
      "id,source,type,amount,admin_fee_amount,admin_fee_category_id,transaction_date,merchant,notes,account_id,transfer_to_account_id,asset_id,liability_id,category_id",
    )
    .eq("id", transactionId)
    .in("type", [
      "income",
      "expense",
      "transfer",
      "investment_buy",
      "investment_sell",
      "debt_payment",
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
