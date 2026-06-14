import Link from "next/link";
import { setTransactionReconciliationStatus } from "@/app/(app)/accounts/actions";
import { MoneyText } from "@/components/ui/money-text";
import { formatDateId } from "@/lib/format";
import type { AccountMutationItem } from "@/lib/accounts/types";
import type { ReconciliationStatus } from "@/types/transaction";

const typePresentation = {
  income: {
    label: "Pemasukan",
    badgeClassName: "bg-income/10 text-income",
  },
  expense: {
    label: "Pengeluaran",
    badgeClassName: "bg-expense/10 text-expense",
  },
  transfer: {
    label: "Transfer",
    badgeClassName: "bg-transfer/10 text-transfer",
  },
  investment_buy: {
    label: "Top up investasi",
    badgeClassName: "bg-investment/10 text-investment",
  },
  investment_sell: {
    label: "Tarik investasi",
    badgeClassName: "bg-investment/10 text-investment",
  },
  debt_payment: {
    label: "Bayar hutang",
    badgeClassName: "bg-debt/10 text-debt",
  },
} as const;

const reconciliationOptions: Array<{
  value: ReconciliationStatus;
  label: string;
  className: string;
  activeClassName: string;
}> = [
  {
    value: "unchecked",
    label: "Belum dicek",
    className: "text-muted",
    activeClassName: "bg-surface-muted text-foreground",
  },
  {
    value: "matched",
    label: "Cocok",
    className: "text-income",
    activeClassName: "bg-income/10 text-income",
  },
  {
    value: "needs_review",
    label: "Periksa",
    className: "text-expense",
    activeClassName: "bg-expense/10 text-expense",
  },
];

function ReconciliationStatusForm({
  accountId,
  transaction,
  returnPath,
}: {
  accountId: string;
  transaction: AccountMutationItem;
  returnPath: string;
}) {
  return (
    <form
      action={setTransactionReconciliationStatus}
      className="mt-3 border-t border-border pt-3"
    >
      <input type="hidden" name="account_id" value={accountId} />
      <input
        type="hidden"
        name="transaction_id"
        value={transaction.id}
      />
      <input type="hidden" name="redirect_to" value={returnPath} />
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
        Rekonsiliasi
      </p>
      <div className="grid grid-cols-3 gap-2">
        {reconciliationOptions.map((option) => {
          const isActive = transaction.reconciliationStatus === option.value;

          return (
            <button
              key={option.value}
              type="submit"
              name="reconciliation_status"
              value={option.value}
              aria-pressed={isActive}
              className={`min-h-9 rounded-control border border-border px-2 text-[0.7rem] font-bold transition active:scale-[0.98] ${
                isActive
                  ? option.activeClassName
                  : `bg-surface ${option.className}`
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </form>
  );
}

export function AccountMutationList({
  accountId,
  accountIsActive,
  returnPath,
  transactions,
}: {
  accountId: string;
  accountIsActive: boolean;
  returnPath: string;
  transactions: AccountMutationItem[];
}) {
  if (transactions.length === 0) {
    return (
      <section className="rounded-card border border-dashed border-accent/40 bg-surface p-7 text-center shadow-card">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent-soft text-xl">
          ↕
        </div>
        <h2 className="mt-4 font-bold">Belum ada mutasi</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Riwayat account ini akan muncul setelah ada transaksi.
        </p>
        {accountIsActive && (
          <Link
            href={`/cashflow/new?account=${accountId}&type=expense&return_to=${encodeURIComponent(
              returnPath,
            )}`}
            className="mt-4 inline-flex min-h-11 items-center rounded-control bg-accent px-5 text-sm font-bold text-accent-foreground transition active:scale-[0.98]"
          >
            Catat transaksi
          </Link>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const presentation = typePresentation[transaction.type];
        const isIncoming = transaction.balanceEffect >= 0;
        const amountClassName = isIncoming ? "text-income" : "text-expense";

        return (
          <article
            key={transaction.id}
            className="rounded-card border border-border bg-surface p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${presentation.badgeClassName}`}
                  >
                    {presentation.label}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDateId(transaction.transactionDate)}
                  </span>
                  {transaction.source === "chat" && (
                    <span className="rounded-full bg-accent-soft px-2 py-1 text-[0.65rem] font-bold text-accent-strong">
                      Via Chat
                    </span>
                  )}
                </div>
                <h2 className="mt-3 truncate font-bold">
                  {transaction.title}
                </h2>
                <p className="mt-1 truncate text-sm text-muted">
                  {transaction.subtitle}
                </p>
              </div>
              <MoneyText
                as="p"
                value={Math.abs(transaction.balanceEffect)}
                sign={isIncoming ? "+" : "-"}
                className={`shrink-0 text-right font-extrabold ${amountClassName}`}
              />
            </div>

            {transaction.adminFeeAmount > 0 &&
              transaction.accountId === accountId && (
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
                  <span className="font-semibold text-muted">
                    {transaction.adminFeeCategoryName ?? "Biaya Admin"}
                  </span>
                  <MoneyText
                    value={transaction.adminFeeAmount}
                    sign="-"
                    className="font-bold text-expense"
                  />
                </div>
              )}

            {transaction.notes && (
              <p className="mt-3 border-t border-border pt-3 text-sm leading-6 text-muted">
                {transaction.notes}
              </p>
            )}

            <ReconciliationStatusForm
              accountId={accountId}
              transaction={transaction}
              returnPath={returnPath}
            />

            <div className="mt-4 flex items-center justify-end border-t border-border pt-3">
              <Link
                href={`/cashflow/${transaction.id}/edit?return_to=${encodeURIComponent(
                  returnPath,
                )}`}
                className="text-sm font-bold text-accent-strong"
              >
                Edit
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
