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

  return "Transfer berhasil dicatat.";
}

function rpcErrorMessage(code?: string) {
  if (code === "PGRST202" || code === "42883") {
    return "Migration manual cashflow belum diterapkan di Supabase.";
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
  const { error } = await supabase.rpc("create_manual_transaction", {
    p_type: input.type,
    p_amount: input.amount,
    p_account_id: input.accountId,
    p_category_id: input.categoryId,
    p_transaction_date: input.transactionDate,
    p_transfer_to_account_id: input.transferToAccountId,
    p_merchant: input.merchant,
    p_notes: input.notes,
  });

  if (error) {
    return { error: rpcErrorMessage(error.code) };
  }

  revalidatePath("/cashflow");
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
  const { error } = await supabase.rpc("update_manual_transaction", {
    p_transaction_id: transactionId,
    p_type: input.type,
    p_amount: input.amount,
    p_account_id: input.accountId,
    p_category_id: input.categoryId,
    p_transaction_date: input.transactionDate,
    p_transfer_to_account_id: input.transferToAccountId,
    p_merchant: input.merchant,
    p_notes: input.notes,
  });

  if (error) {
    return { error: rpcErrorMessage(error.code) };
  }

  revalidatePath("/cashflow");
  revalidatePath("/dashboard");
  revalidatePath("/settings/budgets");
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
  const { error } = await supabase.rpc("delete_manual_transaction", {
    p_transaction_id: transactionId,
  });

  if (error) {
    redirect(
      `/cashflow?error=${encodeURIComponent(rpcErrorMessage(error.code))}`,
    );
  }

  revalidatePath("/cashflow");
  revalidatePath("/dashboard");
  revalidatePath("/settings/budgets");
  redirect(
    `/cashflow?success=${encodeURIComponent("Transaksi berhasil dihapus.")}`,
  );
}
