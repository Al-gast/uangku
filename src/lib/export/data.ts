import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ExportBundle, ExportRow, ExportTable } from "@/lib/export/types";

export class ExportDataError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHORIZED" | "QUERY_FAILED",
  ) {
    super(message);
    this.name = "ExportDataError";
  }
}

function createTable(
  sheetName: string,
  dataLabel: string,
  columns: string[],
  rows: ExportRow[],
): ExportTable {
  return { sheetName, dataLabel, columns, rows };
}

export async function getExportData(): Promise<ExportBundle> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (!userId) {
    throw new ExportDataError("Sesi login tidak ditemukan.", "UNAUTHORIZED");
  }

  const [
    transactionResult,
    accountResult,
    categoryResult,
    budgetResult,
    assetResult,
    liabilityResult,
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "id,type,amount,category_id,account_id,transfer_to_account_id,asset_id,transaction_date,merchant,notes,tags,source,created_at,updated_at",
      )
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false }),
    supabase
      .from("accounts")
      .select(
        "id,name,type,initial_balance,current_balance,currency,is_active,created_at,updated_at",
      )
      .eq("user_id", userId)
      .order("created_at"),
    supabase
      .from("categories")
      .select("id,name")
      .eq("user_id", userId),
    supabase
      .from("budgets")
      .select(
        "id,category_id,period,amount,start_date,end_date,is_active,created_at,updated_at",
      )
      .eq("user_id", userId)
      .order("created_at"),
    supabase
      .from("assets")
      .select(
        "id,account_id,name,type,platform,currency,quantity,unit,total_cost,current_value,notes,created_at,updated_at",
      )
      .eq("user_id", userId)
      .order("created_at"),
    supabase
      .from("liabilities")
      .select(
        "id,name,amount,remaining_amount,due_date,reminder_enabled,notes,created_at,updated_at",
      )
      .eq("user_id", userId)
      .order("created_at"),
  ]);

  const failedResult = [
    transactionResult,
    accountResult,
    categoryResult,
    budgetResult,
    assetResult,
    liabilityResult,
  ].find((result) => result.error);

  if (failedResult?.error) {
    throw new ExportDataError(
      "Data UangKu belum berhasil disiapkan untuk export.",
      "QUERY_FAILED",
    );
  }

  const accountNames = new Map(
    (accountResult.data ?? []).map((account) => [account.id, account.name]),
  );
  const categoryNames = new Map(
    (categoryResult.data ?? []).map((category) => [category.id, category.name]),
  );
  const assetNames = new Map(
    (assetResult.data ?? []).map((asset) => [asset.id, asset.name]),
  );

  const transactions = createTable(
    "Transactions",
    "Transaksi",
    [
      "ID Transaksi",
      "Tanggal",
      "Tipe",
      "Jumlah",
      "Kategori",
      "Akun",
      "Akun Tujuan",
      "Aset",
      "Merchant",
      "Catatan",
      "Tag",
      "Sumber",
      "Dibuat",
      "Diperbarui",
    ],
    (transactionResult.data ?? []).map((transaction) => ({
      "ID Transaksi": transaction.id,
      Tanggal: transaction.transaction_date,
      Tipe: transaction.type,
      Jumlah: Number(transaction.amount),
      Kategori:
        categoryNames.get(transaction.category_id) ?? "Kategori tidak tersedia",
      Akun: accountNames.get(transaction.account_id) ?? "Akun tidak tersedia",
      "Akun Tujuan": transaction.transfer_to_account_id
        ? (accountNames.get(transaction.transfer_to_account_id) ??
          "Akun tidak tersedia")
        : "",
      Aset: transaction.asset_id
        ? (assetNames.get(transaction.asset_id) ?? "Aset tidak tersedia")
        : "",
      Merchant: transaction.merchant ?? "",
      Catatan: transaction.notes ?? "",
      Tag: (transaction.tags ?? []).join(", "),
      Sumber: transaction.source,
      Dibuat: transaction.created_at,
      Diperbarui: transaction.updated_at,
    })),
  );

  const accounts = createTable(
    "Accounts",
    "Akun",
    [
      "ID Akun",
      "Nama",
      "Tipe",
      "Saldo Awal",
      "Saldo Saat Ini",
      "Mata Uang",
      "Aktif",
      "Dibuat",
      "Diperbarui",
    ],
    (accountResult.data ?? []).map((account) => ({
      "ID Akun": account.id,
      Nama: account.name,
      Tipe: account.type,
      "Saldo Awal": Number(account.initial_balance),
      "Saldo Saat Ini": Number(account.current_balance),
      "Mata Uang": account.currency,
      Aktif: account.is_active ? "Ya" : "Tidak",
      Dibuat: account.created_at,
      Diperbarui: account.updated_at,
    })),
  );

  const budgets = createTable(
    "Budgets",
    "Budget",
    [
      "ID Budget",
      "Kategori",
      "Periode",
      "Jumlah",
      "Tanggal Mulai",
      "Tanggal Selesai",
      "Aktif",
      "Dibuat",
      "Diperbarui",
    ],
    (budgetResult.data ?? []).map((budget) => ({
      "ID Budget": budget.id,
      Kategori:
        categoryNames.get(budget.category_id) ?? "Kategori tidak tersedia",
      Periode: budget.period,
      Jumlah: Number(budget.amount),
      "Tanggal Mulai": budget.start_date,
      "Tanggal Selesai": budget.end_date ?? "",
      Aktif: budget.is_active ? "Ya" : "Tidak",
      Dibuat: budget.created_at,
      Diperbarui: budget.updated_at,
    })),
  );

  const assets = createTable(
    "Assets",
    "Aset",
    [
      "ID Aset",
      "Nama",
      "Tipe",
      "Akun Terkait",
      "Platform",
      "Mata Uang",
      "Kuantitas",
      "Unit",
      "Total Modal",
      "Nilai Saat Ini",
      "Catatan",
      "Dibuat",
      "Diperbarui",
    ],
    (assetResult.data ?? []).map((asset) => ({
      "ID Aset": asset.id,
      Nama: asset.name,
      Tipe: asset.type,
      "Akun Terkait": asset.account_id
        ? (accountNames.get(asset.account_id) ?? "Akun tidak tersedia")
        : "",
      Platform: asset.platform ?? "",
      "Mata Uang": asset.currency,
      Kuantitas: asset.quantity === null ? null : Number(asset.quantity),
      Unit: asset.unit ?? "",
      "Total Modal":
        asset.total_cost === null ? null : Number(asset.total_cost),
      "Nilai Saat Ini": Number(asset.current_value),
      Catatan: asset.notes ?? "",
      Dibuat: asset.created_at,
      Diperbarui: asset.updated_at,
    })),
  );

  const liabilities = createTable(
    "Liabilities",
    "Liabilitas",
    [
      "ID Liabilitas",
      "Nama",
      "Jumlah Awal",
      "Sisa Hutang",
      "Jatuh Tempo",
      "Pengingat Aktif",
      "Catatan",
      "Dibuat",
      "Diperbarui",
    ],
    (liabilityResult.data ?? []).map((liability) => ({
      "ID Liabilitas": liability.id,
      Nama: liability.name,
      "Jumlah Awal": Number(liability.amount),
      "Sisa Hutang": Number(liability.remaining_amount),
      "Jatuh Tempo": liability.due_date ?? "",
      "Pengingat Aktif": liability.reminder_enabled ? "Ya" : "Tidak",
      Catatan: liability.notes ?? "",
      Dibuat: liability.created_at,
      Diperbarui: liability.updated_at,
    })),
  );

  return { transactions, accounts, budgets, assets, liabilities };
}
