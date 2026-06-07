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

  revalidatePath("/cashflow");
  revalidatePath("/dashboard");
  revalidatePath("/settings/budgets");
  revalidatePath("/portfolio");
  redirect(
    `/cashflow?success=${encodeURIComponent(successMessage(input.type))}`,
  );
}

export async function updateTransaction(
  _previousState: CashflowActionState,
  formData: FormData,
): Promise<CashflowActionState> {
  const transactionId = String(formData.get("transaction_id") ?? "");

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

  revalidatePath("/cashflow");
  revalidatePath("/dashboard");
  revalidatePath("/settings/budgets");
  revalidatePath("/portfolio");
  redirect(
    `/cashflow?success=${encodeURIComponent("Transaksi berhasil diperbarui.")}`,
  );
}

export async function deleteTransaction(formData: FormData) {
  const transactionId = String(formData.get("transaction_id") ?? "");

  if (!transactionId) {
    redirect(
      `/cashflow?error=${encodeURIComponent("Transaksi tidak ditemukan.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_manual_transaction_with_fee", {
    p_transaction_id: transactionId,
  });

  if (error) {
    redirect(
      `/cashflow?error=${encodeURIComponent(
        rpcErrorMessage(error.code, error.message),
      )}`,
    );
  }

  revalidatePath("/cashflow");
  revalidatePath("/dashboard");
  revalidatePath("/settings/budgets");
  revalidatePath("/portfolio");
  redirect(
    `/cashflow?success=${encodeURIComponent("Transaksi berhasil dihapus.")}`,
  );
}
