"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseManualTransactionForm } from "@/lib/cashflow/validation";

export type CashflowActionState = {
  error: string | null;
};

const initialError =
  "Transaksi belum berhasil disimpan. Coba periksa datanya lagi.";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeRedirectPath(formData: FormData) {
  const redirectTo = String(formData.get("redirect_to") ?? "");

  if (redirectTo === "/cashflow") {
    return redirectTo;
  }

  const accountMatch = redirectTo.match(/^\/accounts\/([^/?#]+)$/);

  if (accountMatch && uuidPattern.test(accountMatch[1] ?? "")) {
    return redirectTo;
  }

  return "/cashflow";
}

function redirectWithMessage(
  path: string,
  key: "success" | "error",
  message: string,
): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

function revalidateTransactionSurfaces(
  accountId?: string,
  transferToAccountId?: string | null,
) {
  revalidatePath("/cashflow");
  revalidatePath("/dashboard");
  revalidatePath("/settings/budgets");
  revalidatePath("/portfolio");
  revalidatePath("/accounts");

  if (accountId) {
    revalidatePath(`/accounts/${accountId}`);
  }

  if (transferToAccountId) {
    revalidatePath(`/accounts/${transferToAccountId}`);
  }
}

function successMessage(type: string) {
  if (type === "income") {
    return "Oke, pemasukan berhasil dicatat.";
  }

  if (type === "expense") {
    return "Oke, pengeluaran berhasil dicatat.";
  }

  if (type === "investment_buy") {
    return "Top up investasi berhasil dicatat.";
  }

  if (type === "investment_sell") {
    return "Tarik investasi berhasil dicatat.";
  }

  if (type === "debt_payment") {
    return "Pembayaran hutang berhasil dicatat.";
  }

  return "Transfer berhasil dicatat.";
}

function rpcErrorMessage(code?: string, message?: string) {
  if (code === "PGRST202" || code === "42883") {
    return "Migration manual cashflow belum diterapkan di Supabase.";
  }

  if (code === "23514" || message?.includes("Asset value cannot be negative")) {
    return "Nilai aset tidak cukup untuk transaksi ini.";
  }

  if (message?.includes("Asset total cost cannot be negative")) {
    return "Total modal aset tidak cukup untuk perubahan transaksi ini.";
  }

  if (message?.includes("Admin fee cannot exceed")) {
    return "Biaya admin tidak boleh lebih besar dari nominal jual.";
  }

  if (message?.includes("Liability remaining cannot be negative")) {
    return "Nominal pokok tidak boleh lebih besar dari sisa hutang.";
  }

  if (message?.includes("Liability not found")) {
    return "Hutang yang dipilih tidak ditemukan.";
  }

  return initialError;
}

export async function createTransaction(
  _previousState: CashflowActionState,
  formData: FormData,
): Promise<CashflowActionState> {
  let input;
  const redirectPath = safeRedirectPath(formData);

  try {
    input = parseManualTransactionForm(formData);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : initialError,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_manual_transaction_with_fee", {
    p_type: input.type,
    p_amount: input.amount,
    p_account_id: input.accountId,
    p_category_id: input.categoryId,
    p_transaction_date: input.transactionDate,
    p_transfer_to_account_id: input.transferToAccountId,
    p_merchant: input.merchant,
    p_notes: input.notes,
    p_asset_id: input.assetId,
    p_admin_fee_amount: input.adminFeeAmount,
    p_liability_id: input.liabilityId,
  });

  if (error) {
    return { error: rpcErrorMessage(error.code, error.message) };
  }

  revalidateTransactionSurfaces(
    input.accountId,
    input.transferToAccountId,
  );
  redirectWithMessage(redirectPath, "success", successMessage(input.type));
}

export async function updateTransaction(
  _previousState: CashflowActionState,
  formData: FormData,
): Promise<CashflowActionState> {
  const transactionId = String(formData.get("transaction_id") ?? "");
  const redirectPath = safeRedirectPath(formData);

  if (!transactionId) {
    return { error: "Transaksi tidak ditemukan." };
  }

  let input;

  try {
    input = parseManualTransactionForm(formData);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : initialError,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_manual_transaction_with_fee", {
    p_transaction_id: transactionId,
    p_type: input.type,
    p_amount: input.amount,
    p_account_id: input.accountId,
    p_category_id: input.categoryId,
    p_transaction_date: input.transactionDate,
    p_transfer_to_account_id: input.transferToAccountId,
    p_merchant: input.merchant,
    p_notes: input.notes,
    p_asset_id: input.assetId,
    p_admin_fee_amount: input.adminFeeAmount,
    p_liability_id: input.liabilityId,
  });

  if (error) {
    return { error: rpcErrorMessage(error.code, error.message) };
  }

  revalidateTransactionSurfaces(
    input.accountId,
    input.transferToAccountId,
  );
  redirectWithMessage(
    redirectPath,
    "success",
    "Transaksi berhasil diperbarui.",
  );
}

export async function deleteTransaction(formData: FormData) {
  const transactionId = String(formData.get("transaction_id") ?? "");
  const redirectPath = safeRedirectPath(formData);

  if (!transactionId) {
    redirectWithMessage(redirectPath, "error", "Transaksi tidak ditemukan.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_manual_transaction_with_fee", {
    p_transaction_id: transactionId,
  });

  if (error) {
    redirectWithMessage(
      redirectPath,
      "error",
      rpcErrorMessage(error.code, error.message),
    );
  }

  revalidateTransactionSurfaces();
  redirectWithMessage(
    redirectPath,
    "success",
    "Transaksi berhasil dihapus.",
  );
}
