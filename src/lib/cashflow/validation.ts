import type { ManualTransactionType } from "@/lib/cashflow/types";

export type ManualTransactionInput = {
  type: ManualTransactionType;
  amount: number;
  accountId: string;
  categoryId: string;
  transactionDate: string;
  transferToAccountId: string | null;
  merchant: string | null;
  notes: string | null;
};

const transactionTypes = new Set<ManualTransactionType>([
  "income",
  "expense",
  "transfer",
]);

function parseAmount(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Nominal harus lebih dari 0 ya.");
  }

  if (amount > 999_999_999_999_999) {
    throw new Error("Nominal terlalu besar.");
  }

  return amount;
}

export function parseManualTransactionForm(
  formData: FormData,
): ManualTransactionInput {
  const type = String(formData.get("type") ?? "") as ManualTransactionType;
  const accountId = String(formData.get("account_id") ?? "");
  const categoryId = String(formData.get("category_id") ?? "");
  const transactionDate = String(formData.get("transaction_date") ?? "");
  const destination = String(formData.get("transfer_to_account_id") ?? "");
  const merchant = String(formData.get("merchant") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!transactionTypes.has(type)) {
    throw new Error("Pilih tipe transaksi.");
  }

  if (!accountId) {
    throw new Error(
      type === "transfer" ? "Pilih akun sumber." : "Pilih akun transaksi.",
    );
  }

  if (!categoryId) {
    throw new Error("Pilih kategori transaksi.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
    throw new Error("Pilih tanggal transaksi.");
  }

  if (type === "transfer" && !destination) {
    throw new Error("Pilih akun tujuan transfer.");
  }

  if (type === "transfer" && destination === accountId) {
    throw new Error("Akun tujuan harus berbeda dari akun sumber.");
  }

  if (merchant.length > 120) {
    throw new Error("Nama merchant maksimal 120 karakter.");
  }

  if (notes.length > 1000) {
    throw new Error("Catatan maksimal 1000 karakter.");
  }

  return {
    type,
    amount: parseAmount(formData.get("amount")),
    accountId,
    categoryId,
    transactionDate: `${transactionDate}T12:00:00+07:00`,
    transferToAccountId: type === "transfer" ? destination : null,
    merchant: merchant || null,
    notes: notes || null,
  };
}
