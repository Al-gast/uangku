"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createTransaction,
  updateTransaction,
  type CashflowActionState,
} from "@/app/(app)/cashflow/actions";
import { usePrivacy } from "@/components/providers/privacy-provider";
import { formatPrivateAmount } from "@/lib/format";
import type {
  CashflowAccountOption,
  CashflowAssetOption,
  CashflowCategoryOption,
  CashflowTransactionItem,
  ManualTransactionType,
} from "@/lib/cashflow/types";

type TransactionFormProps = {
  accounts: CashflowAccountOption[];
  assets: CashflowAssetOption[];
  categories: CashflowCategoryOption[];
  defaultDate: string;
  transaction?: CashflowTransactionItem;
};

const typeOptions: Array<{
  value: ManualTransactionType;
  label: string;
}> = [
  { value: "income", label: "Pemasukan" },
  { value: "expense", label: "Pengeluaran" },
  { value: "transfer", label: "Transfer" },
  { value: "investment_buy", label: "Top up investasi" },
  { value: "investment_sell", label: "Jual / tarik investasi" },
];

const initialState: CashflowActionState = { error: null };

function isInvestmentType(type: ManualTransactionType) {
  return type === "investment_buy" || type === "investment_sell";
}

function supportsAdminFee(type: ManualTransactionType) {
  return type === "transfer" || isInvestmentType(type);
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-13 w-full items-center justify-center rounded-control bg-accent px-5 font-bold text-accent-foreground transition hover:bg-accent-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending
        ? "Menyimpan..."
        : isEditing
          ? "Simpan Perubahan"
          : "Simpan Transaksi"}
    </button>
  );
}

export function TransactionForm({
  accounts,
  assets,
  categories,
  defaultDate,
  transaction,
}: TransactionFormProps) {
  const { privacyEnabled } = usePrivacy();
  const isEditing = Boolean(transaction);
  const action = isEditing ? updateTransaction : createTransaction;
  const [state, formAction] = useActionState(action, initialState);
  const [type, setType] = useState<ManualTransactionType>(
    transaction?.type ?? "expense",
  );
  const [accountId, setAccountId] = useState(
    transaction?.accountId ?? accounts[0]?.id ?? "",
  );
  const [destinationAccountId, setDestinationAccountId] = useState(
    transaction?.transferToAccountId ?? "",
  );
  const [assetId, setAssetId] = useState(
    transaction?.assetId ?? assets[0]?.id ?? "",
  );
  const filteredCategories = useMemo(
    () => {
      const categoryType = isInvestmentType(type) ? "investment" : type;
      return categories.filter(
        (category) => category.transactionType === categoryType,
      );
    },
    [categories, type],
  );
  const selectedCategoryIsValid = filteredCategories.some(
    (category) => category.id === transaction?.categoryId,
  );
  const initialCategoryId =
    transaction && selectedCategoryIsValid
      ? transaction.categoryId
      : (filteredCategories[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(initialCategoryId);

  function changeType(nextType: ManualTransactionType) {
    setType(nextType);
    if (nextType !== "transfer") {
      setDestinationAccountId("");
    }
    if (!isInvestmentType(nextType)) {
      setAssetId("");
    } else if (!assetId) {
      setAssetId(assets[0]?.id ?? "");
    }
    const firstCategory = categories.find(
      (category) =>
        category.transactionType ===
        (isInvestmentType(nextType) ? "investment" : nextType),
    );
    setCategoryId(firstCategory?.id ?? "");
  }

  const investmentType = isInvestmentType(type);
  const selectedAsset = assets.find((asset) => asset.id === assetId);

  if (accounts.length === 0) {
    return (
      <section className="rounded-card border border-border bg-surface p-6 text-center shadow-card">
        <h2 className="text-lg font-bold">Belum ada akun aktif</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Tambahkan atau aktifkan akun dari Settings sebelum mencatat
          transaksi.
        </p>
        <Link
          href="/settings/accounts"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-control bg-accent px-5 font-bold text-accent-foreground"
        >
          Kelola akun
        </Link>
      </section>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {transaction && (
        <input type="hidden" name="transaction_id" value={transaction.id} />
      )}
      <input type="hidden" name="type" value={type} />
      {investmentType && (
        <input type="hidden" name="category_id" value={categoryId} />
      )}

      {state.error && (
        <p className="rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {state.error}
        </p>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-bold">Tipe transaksi</legend>
        <div className="grid grid-cols-2 gap-2">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => changeType(option.value)}
              className={`min-h-11 rounded-control border px-2 text-sm font-bold transition active:scale-[0.98] ${
                type === option.value
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "border-border bg-surface text-muted"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="mb-2 block text-sm font-bold">Nominal</span>
        <div className="flex min-h-14 items-center rounded-control border border-border bg-surface px-4 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
          <span className="mr-2 font-bold text-muted">Rp</span>
          <input
            name="amount"
            inputMode="numeric"
            required
            defaultValue={transaction?.amount ?? ""}
            placeholder="0"
            className="min-w-0 flex-1 bg-transparent text-right text-xl font-bold outline-none"
          />
        </div>
      </label>

      {supportsAdminFee(type) && (
        <label className="block">
          <span className="mb-2 block text-sm font-bold">Biaya admin</span>
          <div className="flex min-h-12 items-center rounded-control border border-border bg-surface px-4 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
            <span className="mr-2 font-bold text-muted">Rp</span>
            <input
              name="admin_fee_amount"
              inputMode="numeric"
              min="0"
              defaultValue={
                transaction?.adminFeeAmount
                  ? transaction.adminFeeAmount
                  : ""
              }
              placeholder="0"
              className="min-w-0 flex-1 bg-transparent text-right font-bold outline-none"
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-muted">
            {type === "investment_sell"
              ? "Nominal masuk ke akun akan dikurangi biaya admin."
              : "Kosongkan jika tidak ada biaya."}
          </p>
        </label>
      )}

      <label className="block">
        <span className="mb-2 block text-sm font-bold">
          {type === "transfer" || type === "investment_buy"
            ? "Dari akun"
            : type === "investment_sell"
              ? "Ke akun"
              : "Akun"}
        </span>
        <select
          name="account_id"
          required
          value={accountId}
          onChange={(event) => {
            const nextAccountId = event.target.value;
            setAccountId(nextAccountId);
            if (destinationAccountId === nextAccountId) {
              setDestinationAccountId("");
            }
          }}
          className="min-h-12 w-full rounded-control border border-border bg-surface px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ·{" "}
              {formatPrivateAmount(account.currentBalance, privacyEnabled)}
            </option>
          ))}
        </select>
      </label>

      {type === "transfer" && (
        <label className="block">
          <span className="mb-2 block text-sm font-bold">Ke akun</span>
          <select
            name="transfer_to_account_id"
            required
            value={destinationAccountId}
            onChange={(event) => setDestinationAccountId(event.target.value)}
            className="min-h-12 w-full rounded-control border border-border bg-surface px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
          >
            <option value="">Pilih akun tujuan</option>
            {accounts
              .filter((account) => account.id !== accountId)
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ·{" "}
                  {formatPrivateAmount(account.currentBalance, privacyEnabled)}
                </option>
              ))}
          </select>
        </label>
      )}

      {investmentType && (
        <label className="block">
          <span className="mb-2 block text-sm font-bold">
            {type === "investment_buy" ? "Ke aset" : "Dari aset"}
          </span>
          <select
            name="asset_id"
            required
            value={assetId}
            onChange={(event) => setAssetId(event.target.value)}
            className="min-h-12 w-full rounded-control border border-border bg-surface px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
          >
            <option value="">Pilih aset investasi</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ·{" "}
                {formatPrivateAmount(asset.currentValue, privacyEnabled)}
              </option>
            ))}
          </select>
          {assets.length === 0 && (
            <p className="mt-2 text-sm leading-6 text-muted">
              Belum ada aset investasi. Tambahkan aset dari Portfolio dulu.
            </p>
          )}
          {type === "investment_sell" && selectedAsset && (
            <p className="mt-2 text-xs text-muted">
              Nilai aset saat ini:{" "}
              {formatPrivateAmount(selectedAsset.currentValue, privacyEnabled)}
            </p>
          )}
        </label>
      )}

      {!investmentType && (
        <label className="block">
          <span className="mb-2 block text-sm font-bold">Kategori</span>
          <select
            name="category_id"
            required
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="min-h-12 w-full rounded-control border border-border bg-surface px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
          >
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="mb-2 block text-sm font-bold">Tanggal</span>
        <input
          name="transaction_date"
          type="date"
          required
          defaultValue={
            transaction
              ? transaction.transactionDate.slice(0, 10)
              : defaultDate
          }
          className="min-h-12 w-full rounded-control border border-border bg-surface px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
        />
      </label>

      <details className="rounded-card border border-border bg-surface p-4">
        <summary className="cursor-pointer font-bold text-accent-strong">
          Tambah detail
        </summary>
        <div className="mt-4 space-y-4">
          {!investmentType && (
            <label className="block">
              <span className="mb-2 block text-sm font-bold">
                Merchant atau sumber
              </span>
              <input
                name="merchant"
                defaultValue={transaction?.merchant ?? ""}
                maxLength={120}
                placeholder={
                  type === "income"
                    ? "Contoh: Kantor"
                    : "Contoh: Warung makan"
                }
                className="min-h-12 w-full rounded-control border border-border bg-background px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
              />
            </label>
          )}
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Catatan</span>
            <textarea
              name="notes"
              defaultValue={transaction?.notes ?? ""}
              maxLength={1000}
              rows={3}
              placeholder="Tambahkan catatan jika perlu"
              className="w-full rounded-control border border-border bg-background px-4 py-3 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
            />
          </label>
        </div>
      </details>

      <SubmitButton isEditing={isEditing} />
      <Link
        href="/cashflow"
        className="flex min-h-11 w-full items-center justify-center font-bold text-muted"
      >
        Batal
      </Link>
    </form>
  );
}
