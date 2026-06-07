"use client";

import { ThemedSelect } from "@/components/ui/themed-select";
import type {
  ChatAccount,
  ChatAsset,
  ChatCategory,
  ChatTransactionDraft,
  ChatTransactionType,
} from "@/lib/chat/types";

const typeOptions: Array<{
  value: ChatTransactionType;
  label: string;
}> = [
  { value: "income", label: "Pemasukan" },
  { value: "expense", label: "Pengeluaran" },
  { value: "transfer", label: "Transfer" },
  { value: "investment_buy", label: "Top up investasi" },
  { value: "investment_sell", label: "Tarik investasi" },
];

const typeStyles = {
  income: "bg-income/10 text-income",
  expense: "bg-expense/10 text-expense",
  transfer: "bg-transfer/10 text-transfer",
  investment_buy: "bg-accent-soft text-accent-strong",
  investment_sell: "bg-accent-soft text-accent-strong",
} as const;

type TransactionPreviewProps = {
  draft: ChatTransactionDraft;
  accounts: ChatAccount[];
  assets: ChatAsset[];
  categories: ChatCategory[];
  isSaving: boolean;
  error: string | null;
  onChange: (draft: ChatTransactionDraft) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function TransactionPreview({
  draft,
  accounts,
  assets,
  categories,
  isSaving,
  error,
  onChange,
  onCancel,
  onSave,
}: TransactionPreviewProps) {
  const isInvestment =
    draft.type === "investment_buy" || draft.type === "investment_sell";
  const supportsAdminFee = draft.type === "transfer" || isInvestment;
  const selectedAsset = assets.find((asset) => asset.id === draft.assetId);
  const availableCategories = categories.filter(
    (category) =>
      category.transactionType ===
      (isInvestment ? "investment" : draft.type),
  );
  const assetError =
    draft.type === "investment_sell" &&
    selectedAsset &&
    draft.amount > selectedAsset.currentValue
      ? "Nilai aset tidak cukup untuk transaksi ini."
      : null;
  const adminFeeError =
    !Number.isFinite(draft.adminFeeAmount) || draft.adminFeeAmount < 0
      ? "Biaya admin tidak boleh negatif."
      : draft.type === "investment_sell" &&
          draft.adminFeeAmount > draft.amount
        ? "Biaya admin tidak boleh lebih besar dari nominal jual."
        : null;
  const inlineError = assetError ?? adminFeeError;
  const isValid =
    draft.amount > 0 &&
    draft.adminFeeAmount >= 0 &&
    Boolean(draft.categoryId && draft.accountId) &&
    (!isInvestment || Boolean(draft.assetId)) &&
    (draft.type !== "transfer" ||
      Boolean(
        draft.transferToAccountId &&
          draft.transferToAccountId !== draft.accountId,
      )) &&
    !inlineError;

  function changeType(type: ChatTransactionType) {
    const nextIsInvestment =
      type === "investment_buy" || type === "investment_sell";
    const firstCategory = categories.find(
      (category) =>
        category.transactionType ===
        (nextIsInvestment ? "investment" : type),
    );
    const firstDestination =
      type === "transfer"
        ? accounts.find((account) => account.id !== draft.accountId)?.id ?? null
        : null;

    onChange({
      ...draft,
      type,
      categoryId: firstCategory?.id ?? "",
      adminFeeAmount:
        type === "transfer" || nextIsInvestment ? draft.adminFeeAmount : 0,
      transferToAccountId: firstDestination,
      assetId: nextIsInvestment ? (draft.assetId ?? assets[0]?.id ?? null) : null,
    });
  }

  return (
    <section className="max-w-[92%] rounded-card border border-accent/25 bg-surface p-5 shadow-card">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        Preview Transaksi
      </p>
      <span
        className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${typeStyles[draft.type]}`}
      >
        {typeOptions.find((option) => option.value === draft.type)?.label}
      </span>

      <div className="mt-4 space-y-4">
        <fieldset>
          <legend className="mb-2 text-xs font-bold text-muted">Tipe</legend>
          <div className="grid grid-cols-2 gap-2">
            {typeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => changeType(option.value)}
                className={`min-h-10 rounded-control border px-2 text-xs font-bold transition active:scale-[0.98] ${
                  draft.type === option.value
                    ? "border-accent bg-accent-soft text-accent-strong"
                    : "border-border bg-background text-muted"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-2 block text-xs font-bold text-muted">
            Nominal
          </span>
          <div className="flex min-h-12 items-center rounded-control border border-border bg-background px-4 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
            <span className="mr-2 font-bold text-muted">Rp</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={draft.amount}
              onChange={(event) =>
                onChange({ ...draft, amount: Number(event.target.value) })
              }
              className="min-w-0 flex-1 bg-transparent text-right text-lg font-bold outline-none"
            />
          </div>
        </label>

        {supportsAdminFee && (
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-muted">
              Biaya admin
            </span>
            <div className="flex min-h-12 items-center rounded-control border border-border bg-background px-4 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
              <span className="mr-2 font-bold text-muted">Rp</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={draft.adminFeeAmount || ""}
                placeholder="0"
                onChange={(event) =>
                  onChange({
                    ...draft,
                    adminFeeAmount:
                      event.target.value === ""
                        ? 0
                        : Number(event.target.value),
                  })
                }
                className="min-w-0 flex-1 bg-transparent text-right font-bold outline-none"
              />
            </div>
          </label>
        )}

        {!isInvestment && (
          <ThemedSelect
            label="Kategori"
            value={draft.categoryId}
            onChange={(categoryId) => onChange({ ...draft, categoryId })}
            options={availableCategories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
          />
        )}

        <ThemedSelect
          label={
            draft.type === "transfer" || draft.type === "investment_buy"
              ? "Dari akun"
              : draft.type === "investment_sell"
                ? "Ke akun"
                : "Akun"
          }
          value={draft.accountId}
          onChange={(accountId) => {
            const destinationAccountId =
              draft.transferToAccountId === accountId
                ? (accounts.find((account) => account.id !== accountId)?.id ??
                  null)
                : draft.transferToAccountId;
            onChange({
              ...draft,
              accountId,
              transferToAccountId: destinationAccountId,
            });
          }}
          options={accounts.map((account) => ({
            value: account.id,
            label: account.name,
          }))}
        />

        {isInvestment && (
          <ThemedSelect
            label={
              draft.type === "investment_buy" ? "Ke aset" : "Dari aset"
            }
            value={draft.assetId ?? ""}
            placeholder="Pilih aset investasi"
            onChange={(assetId) =>
              onChange({
                ...draft,
                assetId: assetId || null,
              })
            }
            options={assets.map((asset) => ({
              value: asset.id,
              label: asset.name,
            }))}
          />
        )}

        {draft.type === "transfer" && (
          <ThemedSelect
            label="Ke akun"
            value={draft.transferToAccountId ?? ""}
            placeholder="Pilih akun tujuan"
            onChange={(transferToAccountId) =>
              onChange({
                ...draft,
                transferToAccountId: transferToAccountId || null,
              })
            }
            options={accounts
              .filter((account) => account.id !== draft.accountId)
              .map((account) => ({
                value: account.id,
                label: account.name,
              }))}
          />
        )}

        <label className="block">
          <span className="mb-2 block text-xs font-bold text-muted">
            Tanggal
          </span>
          <input
            type="date"
            value={draft.transactionDate}
            onChange={(event) =>
              onChange({ ...draft, transactionDate: event.target.value })
            }
            className="min-h-12 w-full rounded-control border border-border bg-background px-4 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
          />
        </label>
      </div>

      {(error || inlineError) && (
        <p className="mt-4 rounded-control bg-expense/10 p-3 text-sm text-expense">
          {error ?? inlineError}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={isSaving}
          onClick={onCancel}
          className="min-h-12 rounded-control border border-border bg-surface text-sm font-bold text-muted transition active:scale-[0.98] disabled:opacity-60"
        >
          Batal
        </button>
        <button
          type="button"
          disabled={isSaving || !isValid}
          onClick={onSave}
          className="min-h-12 rounded-control bg-accent text-sm font-bold text-accent-foreground transition hover:bg-accent-strong active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Menyimpan..." : "Simpan ✓"}
        </button>
      </div>
    </section>
  );
}
