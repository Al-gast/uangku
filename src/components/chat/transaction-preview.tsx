"use client";

import { ThemedSelect } from "@/components/ui/themed-select";
import { ThemedDateInput } from "@/components/ui/themed-date-input";
import { ThemedNumberInput } from "@/components/ui/themed-number-input";
import { formatCompactDateId, formatIdr } from "@/lib/format";
import type {
  ChatAccount,
  ChatAsset,
  ChatCategory,
  ChatDraftWarning,
  ChatLiability,
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
  { value: "debt_payment", label: "Bayar hutang" },
];

const typeStyles = {
  income: "bg-income/10 text-income",
  expense: "bg-expense/10 text-expense",
  transfer: "bg-transfer/10 text-transfer",
  investment_buy: "bg-accent-soft text-accent-strong",
  investment_sell: "bg-accent-soft text-accent-strong",
  debt_payment: "bg-debt/10 text-debt",
} as const;

const summaryTypeLabels: Record<ChatTransactionType, string> = {
  income: "Pemasukan",
  expense: "Pengeluaran",
  transfer: "Transfer",
  investment_buy: "Top up investasi",
  investment_sell: "Tarik investasi",
  debt_payment: "Bayar hutang",
};

type TransactionPreviewProps = {
  draft: ChatTransactionDraft;
  accounts: ChatAccount[];
  assets: ChatAsset[];
  liabilities: ChatLiability[];
  categories: ChatCategory[];
  isSaving: boolean;
  error: string | null;
  title?: string;
  subtitle?: string;
  cancelLabel?: string;
  saveLabel?: string;
  savingLabel?: string;
  onChange: (draft: ChatTransactionDraft) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function TransactionPreview({
  draft,
  accounts,
  assets,
  liabilities,
  categories,
  isSaving,
  error,
  title = "Preview Transaksi",
  subtitle,
  cancelLabel = "Batal",
  saveLabel = "Simpan ✓",
  savingLabel = "Menyimpan...",
  onChange,
  onCancel,
  onSave,
}: TransactionPreviewProps) {
  const isInvestment =
    draft.type === "investment_buy" || draft.type === "investment_sell";
  const isDebtPayment = draft.type === "debt_payment";
  const isSimpleCashflow = draft.type === "income" || draft.type === "expense";
  const supportsAdminFee =
    draft.type === "transfer" || isInvestment || isDebtPayment;
  const warnings = draft.warnings ?? [];
  const selectedAsset = assets.find((asset) => asset.id === draft.assetId);
  const selectedLiability = liabilities.find(
    (liability) => liability.id === draft.liabilityId,
  );
  const selectedAccount = accounts.find(
    (account) => account.id === draft.accountId,
  );
  const selectedDestinationAccount = accounts.find(
    (account) => account.id === draft.transferToAccountId,
  );
  const selectedCategory = categories.find(
    (category) => category.id === draft.categoryId,
  );
  const availableCategories = categories.filter(
    (category) =>
      category.transactionType ===
      (isInvestment ? "investment" : isDebtPayment ? "debt" : draft.type),
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
  const liabilityError =
    isDebtPayment &&
    selectedLiability &&
    draft.amount > selectedLiability.remainingAmount
      ? "Nominal pokok tidak boleh lebih besar dari sisa hutang."
      : null;
  const inlineError = assetError ?? liabilityError ?? adminFeeError;
  const isValid =
    draft.amount > 0 &&
    draft.adminFeeAmount >= 0 &&
    Boolean(draft.categoryId && draft.accountId) &&
    (!isInvestment || Boolean(draft.assetId)) &&
    (!isDebtPayment || Boolean(draft.liabilityId)) &&
    (draft.type !== "transfer" ||
      Boolean(
        draft.transferToAccountId &&
          draft.transferToAccountId !== draft.accountId,
      )) &&
    !inlineError;

  function updateDraft(
    patch: Partial<ChatTransactionDraft>,
    clearWarningTypes: ChatDraftWarning["type"][] = [],
  ) {
    const nextWarnings =
      clearWarningTypes.length === 0
        ? draft.warnings
        : draft.warnings?.filter(
            (warning) => !clearWarningTypes.includes(warning.type),
          );

    onChange({
      ...draft,
      ...patch,
      warnings: nextWarnings,
    });
  }

  function changeType(type: ChatTransactionType) {
    const nextIsInvestment =
      type === "investment_buy" || type === "investment_sell";
    const nextIsDebtPayment = type === "debt_payment";
    const firstCategory = categories.find(
      (category) =>
        category.transactionType ===
        (nextIsInvestment ? "investment" : nextIsDebtPayment ? "debt" : type),
    );
    const firstDestination =
      type === "transfer"
        ? accounts.find((account) => account.id !== draft.accountId)?.id ?? null
        : null;

    updateDraft(
      {
      type,
      categoryId: firstCategory?.id ?? "",
      adminFeeAmount:
        type === "transfer" || nextIsInvestment || nextIsDebtPayment
          ? draft.adminFeeAmount
          : 0,
      transferToAccountId: firstDestination,
      assetId: nextIsInvestment ? (draft.assetId ?? assets[0]?.id ?? null) : null,
      liabilityId: nextIsDebtPayment
        ? (draft.liabilityId ?? liabilities[0]?.id ?? null)
        : null,
      merchant:
        type === "income" || type === "expense" ? draft.merchant : null,
      notes: type === "income" || type === "expense" ? draft.notes : null,
      },
      [
        "category_alias",
        "date_default",
        "default_account",
        "detail_extracted",
      ],
    );
  }

  function previewSummary() {
    const amount = formatIdr(draft.amount || 0);
    const date = formatCompactDateId(
      `${draft.transactionDate}T12:00:00+07:00`,
    );

    if (draft.type === "transfer") {
      return `${summaryTypeLabels[draft.type]} ${amount} dari ${
        selectedAccount?.name ?? "akun"
      } ke ${selectedDestinationAccount?.name ?? "akun tujuan"} pada ${date}.`;
    }

    if (isInvestment) {
      return `${summaryTypeLabels[draft.type]} ${amount} ${
        draft.type === "investment_buy" ? "ke" : "dari"
      } ${selectedAsset?.name ?? "aset"} ${
        draft.type === "investment_buy" ? "dari" : "ke"
      } ${selectedAccount?.name ?? "akun"} pada ${date}.`;
    }

    if (isDebtPayment) {
      return `${summaryTypeLabels[draft.type]} ${amount} untuk ${
        selectedLiability?.name ?? "hutang"
      } dari ${selectedAccount?.name ?? "akun"} pada ${date}.`;
    }

    return `${summaryTypeLabels[draft.type]} ${
      selectedCategory?.name ?? "kategori"
    } ${amount} dari ${selectedAccount?.name ?? "akun"} pada ${date}.`;
  }

  return (
    <section className="max-w-[92%] rounded-card border border-accent/25 bg-surface p-5 shadow-card">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        {title}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs leading-5 text-muted">{subtitle}</p>
      )}
      <span
        className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${typeStyles[draft.type]}`}
      >
        {typeOptions.find((option) => option.value === draft.type)?.label}
      </span>

      <p className="mt-3 rounded-control bg-surface-muted p-3 text-sm font-semibold leading-6 text-foreground">
        {previewSummary()}
      </p>

      {warnings.length > 0 && (
        <div className="mt-4 space-y-2 rounded-control border border-accent/20 bg-accent-soft p-3">
          {warnings.map((warning) => (
            <p
              key={`${warning.type}-${warning.message}`}
              className="text-xs leading-5 text-accent-strong"
            >
              {warning.message}
            </p>
          ))}
        </div>
      )}

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

        <ThemedNumberInput
          label={
            <span className="text-xs text-muted">
              {isDebtPayment ? "Nominal pokok" : "Nominal"}
            </span>
          }
          prefix="Rp"
          inputMode="numeric"
          min="1"
          value={draft.amount}
          surface="background"
          textSize="lg"
          onChange={(value) =>
            updateDraft({ amount: Number(value) })
          }
        />

        {supportsAdminFee && (
          <ThemedNumberInput
            label={
              <span className="text-xs text-muted">
                {isDebtPayment ? "Biaya/bunga" : "Biaya admin"}
              </span>
            }
            prefix="Rp"
            inputMode="numeric"
            min="0"
            value={draft.adminFeeAmount || ""}
            placeholder="0"
            surface="background"
            onChange={(value) =>
              updateDraft({
                adminFeeAmount: value === "" ? 0 : Number(value),
              })
            }
          />
        )}

        {!isInvestment && !isDebtPayment && (
          <ThemedSelect
            label="Kategori"
            value={draft.categoryId}
            onChange={(categoryId) =>
              updateDraft({ categoryId }, ["category_alias"])
            }
            options={availableCategories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
          />
        )}

        {isSimpleCashflow && (
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-muted">
              Detail
            </span>
            <input
              value={draft.merchant ?? ""}
              maxLength={120}
              placeholder="cth: ayam goreng, parkir, cilok"
              onChange={(event) =>
                updateDraft(
                  { merchant: event.target.value.trimStart() || null },
                  ["detail_extracted"],
                )
              }
              className="min-h-12 w-full rounded-control border border-border bg-background px-4 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
            />
          </label>
        )}

        <ThemedSelect
          label={
            draft.type === "transfer" ||
            draft.type === "investment_buy" ||
            isDebtPayment
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
            updateDraft(
              {
              accountId,
              transferToAccountId: destinationAccountId,
              },
              ["default_account"],
            );
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
              updateDraft({
                assetId: assetId || null,
              })
            }
            options={assets.map((asset) => ({
              value: asset.id,
              label: asset.name,
            }))}
          />
        )}

        {isDebtPayment && (
          <ThemedSelect
            label="Hutang"
            value={draft.liabilityId ?? ""}
            placeholder="Pilih hutang"
            onChange={(liabilityId) =>
              updateDraft({
                liabilityId: liabilityId || null,
              })
            }
            options={liabilities.map((liability) => ({
              value: liability.id,
              label: liability.name,
              description: `Sisa Rp${liability.remainingAmount.toLocaleString(
                "id-ID",
              )}`,
            }))}
          />
        )}

        {draft.type === "transfer" && (
          <ThemedSelect
            label="Ke akun"
            value={draft.transferToAccountId ?? ""}
            placeholder="Pilih akun tujuan"
            onChange={(transferToAccountId) =>
              updateDraft({
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

        <ThemedDateInput
          label={<span className="text-xs text-muted">Tanggal</span>}
          value={draft.transactionDate}
          surface="background"
          onChange={(transactionDate) =>
            updateDraft({ transactionDate }, ["date_default"])
          }
        />
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
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={isSaving || !isValid}
          onClick={onSave}
          className="min-h-12 rounded-control bg-accent text-sm font-bold text-accent-foreground transition hover:bg-accent-strong active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? savingLabel : saveLabel}
        </button>
      </div>
    </section>
  );
}
