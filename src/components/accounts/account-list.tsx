import Link from "next/link";
import {
  spendableAccountTypeLabels,
  spendableAccountTypeOptions,
} from "@/constants/accounts";
import { MoneyText } from "@/components/ui/money-text";
import { Icon } from "@/components/ui/icons";
import type { SettingsAccountItem } from "@/lib/accounts/types";

const accountTypeIcons = Object.fromEntries(
  spendableAccountTypeOptions.map((option) => [option.value, option.icon]),
) as Record<SettingsAccountItem["type"], string>;

export function AccountList({
  accounts,
}: {
  accounts: SettingsAccountItem[];
}) {
  if (accounts.length === 0) {
    return (
      <section className="rounded-card border border-dashed border-accent/40 bg-surface p-7 text-center shadow-card">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent-soft text-xl">
          🏦
        </div>
        <h2 className="mt-4 font-bold">Belum ada account</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Tambahkan tunai, rekening bank, atau e-wallet dari Settings.
        </p>
        <Link
          href="/settings/accounts"
          className="mt-4 inline-flex min-h-11 items-center rounded-control bg-accent px-5 text-sm font-bold text-accent-foreground transition active:scale-[0.98]"
        >
          Kelola akun
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <Link
          key={account.id}
          href={`/accounts/${account.id}`}
          className={`block rounded-card border bg-surface p-5 shadow-card transition hover:border-accent/50 active:scale-[0.99] ${
            account.isActive ? "border-border" : "border-border opacity-70"
          }`}
        >
          <article className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-xl"
                aria-hidden="true"
              >
                {accountTypeIcons[account.type]}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-bold">
                  {account.name}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>{spendableAccountTypeLabels[account.type]}</span>
                  <span>•</span>
                  <span>{account.transactionCount} transaksi</span>
                  {!account.isActive && (
                    <>
                      <span>•</span>
                      <span>Nonaktif</span>
                    </>
                  )}
                </span>
              </span>
            </div>
            <span className="flex shrink-0 items-center gap-2 text-right">
              <MoneyText
                value={account.currentBalance}
                className="font-extrabold"
              />
              <Icon name="arrow" className="size-5 text-muted" />
            </span>
          </article>
        </Link>
      ))}
    </div>
  );
}
