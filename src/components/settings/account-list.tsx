import Link from "next/link";
import {
  deleteAccount,
  setAccountActive,
} from "@/app/(app)/settings/accounts/actions";
import { spendableAccountTypeLabels } from "@/constants/accounts";
import { MoneyText } from "@/components/ui/money-text";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import type { SettingsAccountItem } from "@/lib/accounts/types";

export function AccountList({
  accounts,
}: {
  accounts: SettingsAccountItem[];
}) {
  if (accounts.length === 0) {
    return (
      <section className="rounded-card border border-dashed border-accent/40 bg-surface p-7 text-center shadow-card">
        <h2 className="font-bold">Belum ada akun</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Tambahkan rekening, e-wallet, atau tunai yang kamu pakai sehari-hari.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <article
          key={account.id}
          className={`rounded-card border bg-surface p-5 shadow-card ${
            account.isActive ? "border-border" : "border-border opacity-70"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[0.65rem] font-bold text-accent-strong">
                  {spendableAccountTypeLabels[account.type]}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${
                    account.isActive
                      ? "bg-income/10 text-income"
                      : "bg-surface-muted text-muted"
                  }`}
                >
                  {account.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <h2 className="mt-3 truncate font-bold">{account.name}</h2>
              <p className="mt-1 text-xs text-muted">
                {account.transactionCount} transaksi terkait
              </p>
            </div>
            <div className="shrink-0 text-right">
              <MoneyText
                as="p"
                value={account.currentBalance}
                className="font-extrabold"
              />
              <p className="mt-1 text-xs text-muted">
                Awal: <MoneyText value={account.initialBalance} />
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-4 border-t border-border pt-3">
            <Link
              href={`/settings/accounts/${account.id}/edit`}
              className="text-sm font-bold text-accent-strong"
            >
              Edit
            </Link>
            <form action={setAccountActive}>
              <input type="hidden" name="account_id" value={account.id} />
              <input
                type="hidden"
                name="is_active"
                value={account.isActive ? "false" : "true"}
              />
              <button
                type="submit"
                className="text-sm font-bold text-muted"
              >
                {account.isActive ? "Nonaktifkan" : "Aktifkan"}
              </button>
            </form>
            {account.transactionCount === 0 ? (
              <ConfirmActionForm
                submitAction={deleteAccount}
                fields={[{ name: "account_id", value: account.id }]}
                buttonLabel="Hapus"
                title="Hapus akun ini?"
                description="Akun hanya bisa dihapus jika belum punya transaksi. Kalau sudah punya histori, nonaktifkan saja agar data lama tetap aman."
                confirmLabel="Hapus Akun"
              />
            ) : (
              <span className="text-sm font-bold text-muted/70">
                Punya transaksi
              </span>
            )}
          </div>
          {account.transactionCount > 0 && (
            <p className="mt-3 rounded-control bg-surface-muted p-3 text-xs leading-5 text-muted">
              Akun ini sudah punya transaksi, jadi tidak bisa dihapus. Kamu
              bisa menonaktifkannya agar tidak muncul di pilihan transaksi
              baru.
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
