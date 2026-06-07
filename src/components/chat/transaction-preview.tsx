"use client";

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
  const selectedAsset = assets.find((asset) => asset.id === draft.assetId);
  const availableCategories = categories.filter(
    (category) =>
      category.transactionType ===
      (isInvestment ? "investment" : draft.type),
  );
  const inlineError =
    draft.type === "investment_sell" &&
    selectedAsset &&
    draft.amount > selectedAsset.currentValue
      ? "Nilai aset tidak cukup untuk transaksi ini."
      : null;
  const isValid =
    draft.amount > 0 &&
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

        {!isInvestment && (
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-muted">
              Kategori
            </span>
            <select
              value={draft.categoryId}
              onChange={(event) =>
                onChange({ ...draft, categoryId: event.target.value })
              }
              className="min-h-12 w-full rounded-control border border-border bg-background px-4 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
            >
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="mb-2 block text-xs font-bold text-muted">
            {draft.type === "transfer" || draft.type === "investment_buy"
              ? "Dari akun"
              : draft.type === "investment_sell"
                ? "Ke akun"
                : "Akun"}
          </span>
          <select
            value={draft.accountId}
            onChange={(event) => {
              const accountId = event.target.value;
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
            className="min-h-12 w-full rounded-control border border-border bg-background px-4 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        {isInvestment && (
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-muted">
              {draft.type === "investment_buy" ? "Ke aset" : "Dari aset"}
            </span>
            <select
              value={draft.assetId ?? ""}
              onChange={(event) =>
                onChange({
                  ...draft,
                  assetId: event.target.value || null,
                })
              }
              className="min-h-12 w-full rounded-control border border-border bg-background px-4 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
            >
              <option value="">Pilih aset investasi</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {draft.type === "transfer" && (
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-muted">
              Ke akun
            </span>
            <select
              value={draft.transferToAccountId ?? ""}
              onChange={(event) =>
                onChange({
                  ...draft,
                  transferToAccountId: event.target.value || null,
                })
              }
              className="min-h-12 w-full rounded-control border border-border bg-background px-4 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
            >
              <option value="">Pilih akun tujuan</option>
              {accounts
                .filter((account) => account.id !== draft.accountId)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
            </select>
          </label>
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
