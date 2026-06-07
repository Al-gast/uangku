"use server";

import { revalidatePath } from "next/cache";
import type {
  ChatSaveResult,
  ChatTransactionDraft,
  ChatTransactionType,
} from "@/lib/chat/types";
import { createClient } from "@/lib/supabase/server";

const SUPPORTED_TYPES = new Set<ChatTransactionType>([
  "income",
  "expense",
  "transfer",
]);
const MAX_AMOUNT = 999_000_000_000_000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function confirmationMessage(type: ChatTransactionType) {
  if (type === "income") {
    return "Oke, pemasukan sudah dicatat ✓";
  }

  if (type === "expense") {
    return "Oke, pengeluaran sudah dicatat ✓";
  }

  return "Oke, transfer sudah dicatat ✓";
}

function isValidUuid(value: string | null) {
  return Boolean(value && UUID_PATTERN.test(value));
}

function validateDraft(draft: ChatTransactionDraft) {
  if (!SUPPORTED_TYPES.has(draft.type)) {
    return "Tipe transaksi belum didukung.";
  }

  if (
    !Number.isFinite(draft.amount) ||
    draft.amount <= 0 ||
    draft.amount > MAX_AMOUNT
  ) {
    return "Nominal transaksi tidak valid.";
  }

  if (
    !isValidUuid(draft.accountId) ||
    !isValidUuid(draft.categoryId) ||
    !DATE_PATTERN.test(draft.transactionDate)
  ) {
    return "Data preview belum lengkap.";
  }

  if (
    draft.type === "transfer" &&
    (!isValidUuid(draft.transferToAccountId) ||
      draft.transferToAccountId === draft.accountId)
  ) {
    return "Pilih akun tujuan transfer yang berbeda.";
  }

  if (draft.type !== "transfer" && draft.transferToAccountId) {
    return "Akun tujuan hanya digunakan untuk transfer.";
  }

  return null;
}

export async function saveChatTransaction(
  draft: ChatTransactionDraft,
): Promise<ChatSaveResult> {
  const validationError = validateDraft(draft);

  if (validationError) {
    return { success: false, error: validationError };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_chat_transaction", {
    p_type: draft.type,
    p_amount: draft.amount,
    p_account_id: draft.accountId,
    p_category_id: draft.categoryId,
    p_transaction_date: draft.transactionDate,
    p_transfer_to_account_id: draft.transferToAccountId,
  });

  if (error) {
    return {
      success: false,
      error:
        error.code === "PGRST202" || error.code === "42883"
          ? "Migration Chat Input belum diterapkan di Supabase."
          : "Transaksi belum berhasil disimpan. Periksa preview lalu coba lagi.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/cashflow");
  revalidatePath("/chat");
  revalidatePath("/settings/budgets");

  return {
    success: true,
    message: confirmationMessage(draft.type),
  };
}
