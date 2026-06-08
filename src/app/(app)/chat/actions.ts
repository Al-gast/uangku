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
  "investment_buy",
  "investment_sell",
  "debt_payment",
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

  if (type === "investment_buy") {
    return "Oke, top up investasi sudah dicatat ✓";
  }

  if (type === "investment_sell") {
    return "Oke, tarik investasi sudah dicatat ✓";
  }

  if (type === "debt_payment") {
    return "Oke, pembayaran hutang sudah dicatat ✓";
  }

  return "Oke, transfer sudah dicatat ✓";
}

function isInvestmentType(type: ChatTransactionType) {
  return type === "investment_buy" || type === "investment_sell";
}

function isDebtPaymentType(type: ChatTransactionType) {
  return type === "debt_payment";
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
    !Number.isFinite(draft.adminFeeAmount) ||
    draft.adminFeeAmount < 0 ||
    draft.adminFeeAmount > MAX_AMOUNT
  ) {
    return "Biaya admin tidak valid.";
  }

  if (
    !isInvestmentType(draft.type) &&
    draft.type !== "transfer" &&
    !isDebtPaymentType(draft.type) &&
    draft.adminFeeAmount > 0
  ) {
    return "Biaya admin hanya untuk transfer, investasi, atau bayar hutang.";
  }

  if (
    draft.type === "investment_sell" &&
    draft.adminFeeAmount > draft.amount
  ) {
    return "Biaya admin tidak boleh lebih besar dari nominal jual.";
  }

  if (
    !isValidUuid(draft.accountId) ||
    !isValidUuid(draft.categoryId) ||
    !DATE_PATTERN.test(draft.transactionDate)
  ) {
    return "Data preview belum lengkap.";
  }

  if ((draft.merchant ?? "").trim().length > 120) {
    return "Detail maksimal 120 karakter.";
  }

  if ((draft.notes ?? "").trim().length > 1000) {
    return "Catatan maksimal 1000 karakter.";
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

  if (isInvestmentType(draft.type) && !isValidUuid(draft.assetId)) {
    return "Pilih aset investasi.";
  }

  if (!isInvestmentType(draft.type) && draft.assetId) {
    return "Aset hanya digunakan untuk transaksi investasi.";
  }

  if (isDebtPaymentType(draft.type) && !isValidUuid(draft.liabilityId)) {
    return "Pilih hutang yang dibayar.";
  }

  if (!isDebtPaymentType(draft.type) && draft.liabilityId) {
    return "Hutang hanya digunakan untuk transaksi bayar hutang.";
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
  const { error } = await supabase.rpc("create_chat_transaction_with_fee", {
    p_type: draft.type,
    p_amount: draft.amount,
    p_account_id: draft.accountId,
    p_category_id: draft.categoryId,
    p_transaction_date: draft.transactionDate,
    p_transfer_to_account_id: draft.transferToAccountId,
    p_asset_id: draft.assetId,
    p_admin_fee_amount: draft.adminFeeAmount,
    p_liability_id: draft.liabilityId,
    p_merchant: draft.merchant,
    p_notes: draft.notes,
  });

  if (error) {
    return {
      success: false,
      error:
        error.code === "PGRST202" || error.code === "42883"
          ? "Migration Chat Input belum diterapkan di Supabase."
          : error.code === "23514" ||
              error.message.includes("Asset value cannot be negative")
            ? "Nilai aset tidak cukup untuk transaksi ini."
          : error.message.includes("Admin fee cannot exceed")
            ? "Biaya admin tidak boleh lebih besar dari nominal jual."
          : error.message.includes("Liability remaining cannot be negative")
            ? "Nominal pokok tidak boleh lebih besar dari sisa hutang."
          : error.message.includes("Liability not found")
            ? "Hutang yang dipilih tidak ditemukan."
          : "Transaksi belum berhasil disimpan. Periksa preview lalu coba lagi.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/cashflow");
  revalidatePath("/chat");
  revalidatePath("/portfolio");
  revalidatePath("/settings/budgets");

  return {
    success: true,
    message: confirmationMessage(draft.type),
  };
}
