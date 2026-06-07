import type { ManualTransactionType } from "@/lib/cashflow/types";

export type ManualTransactionInput = {
  type: ManualTransactionType;
  amount: number;
  adminFeeAmount: number;
  accountId: string;
  categoryId: string;
  transactionDate: string;
  transferToAccountId: string | null;
  assetId: string | null;
  liabilityId: string | null;
  merchant: string | null;
  notes: string | null;
};

const transactionTypes = new Set<ManualTransactionType>([
  "income",
  "expense",
  "transfer",
  "investment_buy",
  "investment_sell",
  "debt_payment",
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

function parseAdminFee(value: FormDataEntryValue | null) {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return 0;
  }

  const normalized = rawValue
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Biaya admin tidak boleh negatif.");
  }

  if (amount > 999_999_999_999_999) {
    throw new Error("Biaya admin terlalu besar.");
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
  const assetId = String(formData.get("asset_id") ?? "");
  const liabilityId = String(formData.get("liability_id") ?? "");
  const merchant = String(formData.get("merchant") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const isInvestment =
    type === "investment_buy" || type === "investment_sell";
  const isDebtPayment = type === "debt_payment";
  const amount = parseAmount(formData.get("amount"));
  const adminFeeAmount = parseAdminFee(formData.get("admin_fee_amount"));
  const supportsAdminFee =
    type === "transfer" ||
    type === "investment_buy" ||
    type === "investment_sell" ||
    isDebtPayment;

  if (!transactionTypes.has(type)) {
    throw new Error("Pilih tipe transaksi.");
  }

  if (!supportsAdminFee && adminFeeAmount > 0) {
    throw new Error(
      "Biaya admin hanya untuk transfer, investasi, atau bayar hutang.",
    );
  }

  if (type === "investment_sell" && adminFeeAmount > amount) {
    throw new Error("Biaya admin tidak boleh lebih besar dari nominal jual.");
  }

  if (!accountId) {
    throw new Error(
      type === "transfer" || type === "investment_buy"
        ? "Pilih akun sumber."
        : isDebtPayment
          ? "Pilih akun pembayaran."
        : "Pilih akun transaksi.",
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

  if (isInvestment && !assetId) {
    throw new Error("Pilih aset investasi.");
  }

  if (isDebtPayment && !liabilityId) {
    throw new Error("Pilih hutang yang dibayar.");
  }

  if (!isInvestment && assetId) {
    throw new Error("Aset hanya digunakan untuk transaksi investasi.");
  }

  if (!isDebtPayment && liabilityId) {
    throw new Error("Hutang hanya digunakan untuk transaksi bayar hutang.");
  }

  if (type !== "transfer" && destination) {
    throw new Error("Akun tujuan hanya digunakan untuk transfer.");
  }

  if (merchant.length > 120) {
    throw new Error("Nama merchant maksimal 120 karakter.");
  }

  if (notes.length > 1000) {
    throw new Error("Catatan maksimal 1000 karakter.");
  }

  return {
    type,
    amount,
    adminFeeAmount,
    accountId,
    categoryId,
    transactionDate: `${transactionDate}T12:00:00+07:00`,
    transferToAccountId: type === "transfer" ? destination : null,
    assetId: isInvestment ? assetId : null,
    liabilityId: isDebtPayment ? liabilityId : null,
    merchant: merchant || null,
    notes: notes || null,
  };
}
