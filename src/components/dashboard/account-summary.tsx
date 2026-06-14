import Link from "next/link";
import { MoneyText } from "@/components/ui/money-text";
import type { DashboardAccount } from "@/lib/dashboard/types";

const accountIcons: Record<DashboardAccount["type"], string> = {
  cash: "💵",
  bank_account: "🏦",
  e_wallet: "📱",
};

type AccountSummaryProps = {
  accounts: DashboardAccount[];
  error?: string | null;
};

export function AccountSummary({ accounts, error }: AccountSummaryProps) {
  const total = accounts.reduce(
    (sum, account) => sum + account.currentBalance,
    0,
  );

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Saldo Akun</h2>
        {accounts.length > 0 && !error && (
          <Link
            href="/accounts"
            className="text-sm font-bold text-accent-strong"
          >
            Lihat semua
          </Link>
        )}
      </div>

      {error ? (
        <p className="mt-3 rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {error}
        </p>
      ) : accounts.length === 0 ? (
        <div className="mt-3 rounded-card border border-dashed border-border bg-surface p-5 text-center text-sm text-muted">
          Belum ada akun
        </div>
      ) : (
        <>
          <div className="-mx-5 mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
            {accounts.map((account) => (
              <Link
                key={account.id}
                href={`/accounts/${account.id}`}
                className="min-w-[140px] snap-start rounded-card border border-border bg-surface p-4 shadow-card"
              >
                <span className="text-lg" aria-hidden="true">
                  {accountIcons[account.type]}
                </span>
                <p className="mt-2 truncate text-sm font-semibold">
                  {account.name}
                </p>
                <MoneyText
                  as="p"
                  value={account.currentBalance}
                  className="mt-1 text-base font-bold"
                />
              </Link>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-end gap-2">
            <span className="text-sm text-muted">Total</span>
            <MoneyText value={total} className="font-bold" />
          </div>
        </>
      )}
    </section>
  );
}
