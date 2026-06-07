"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createAccount,
  updateAccount,
  type AccountActionState,
} from "@/app/(app)/settings/accounts/actions";
import { spendableAccountTypeOptions } from "@/constants/accounts";
import type { SettingsAccountItem } from "@/lib/accounts/types";

const initialState: AccountActionState = { error: null };

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-12 w-full items-center justify-center rounded-control bg-accent px-4 text-sm font-bold text-accent-foreground transition active:scale-[0.98] disabled:opacity-60"
    >
      {pending
        ? "Menyimpan..."
        : isEditing
          ? "Simpan perubahan"
          : "Tambah akun"}
    </button>
  );
}

export function AccountForm({
  account,
}: {
  account?: SettingsAccountItem;
}) {
  const isEditing = Boolean(account);
  const hasTransactions = (account?.transactionCount ?? 0) > 0;
  const action = isEditing ? updateAccount : createAccount;
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {account && <input type="hidden" name="account_id" value={account.id} />}

      {state.error && (
        <p className="rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {state.error}
        </p>
      )}

      <label className="block">
        <span className="mb-2 block text-sm font-bold">Nama akun</span>
        <input
          name="name"
          required
          maxLength={100}
          defaultValue={account?.name ?? ""}
          placeholder="Contoh: BCA, Jago, GoPay"
          className="min-h-12 w-full rounded-control border border-border bg-background px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold">Jenis akun</span>
        {hasTransactions && account && (
          <input type="hidden" name="type" value={account.type} />
        )}
        <select
          name="type"
          required
          disabled={hasTransactions}
          defaultValue={account?.type ?? "bank_account"}
          className="min-h-12 w-full rounded-control border border-border bg-background px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted"
        >
          {spendableAccountTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.icon} {option.label}
            </option>
          ))}
        </select>
        {hasTransactions && (
          <p className="mt-2 text-xs leading-5 text-muted">
            Jenis akun tidak bisa diubah karena akun ini sudah punya transaksi.
          </p>
        )}
      </label>

      {!isEditing && (
        <label className="block">
          <span className="mb-2 block text-sm font-bold">Saldo awal</span>
          <div className="flex min-h-12 items-center rounded-control border border-border bg-background px-4 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
            <span className="mr-2 font-bold text-muted">Rp</span>
            <input
              name="initial_balance"
              inputMode="numeric"
              placeholder="0"
              className="min-w-0 flex-1 bg-transparent text-right font-bold outline-none"
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-muted">
            Saldo awal hanya bisa diatur saat akun dibuat. Perubahan saldo
            berikutnya dicatat lewat transaksi.
          </p>
        </label>
      )}

      {isEditing && (
        <p className="rounded-control bg-surface-muted p-4 text-xs leading-5 text-muted">
          Saldo akun tidak bisa diubah langsung dari halaman ini. Gunakan
          Cashflow untuk menjaga riwayat dan saldo tetap konsisten.
        </p>
      )}

      <SubmitButton isEditing={isEditing} />
    </form>
  );
}
