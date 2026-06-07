import { formatIdr } from "@/lib/format";
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
      <h2 className="text-lg font-bold">Saldo Akun</h2>

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
              <article
                key={account.id}
                className="min-w-[140px] snap-start rounded-card border border-border bg-surface p-4 shadow-card"
              >
                <span className="text-lg" aria-hidden="true">
                  {accountIcons[account.type]}
                </span>
                <p className="mt-2 truncate text-sm font-semibold">
                  {account.name}
                </p>
                <p className="mt-1 text-base font-bold">
                  {formatIdr(account.currentBalance)}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-end gap-2">
            <span className="text-sm text-muted">Total</span>
            <span className="font-bold">{formatIdr(total)}</span>
          </div>
        </>
      )}
    </section>
  );
}
