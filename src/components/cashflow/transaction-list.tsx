import Link from "next/link";
import { deleteTransaction } from "@/app/(app)/cashflow/actions";
import { formatDateId, formatIdr } from "@/lib/format";
import type { CashflowTransactionItem } from "@/lib/cashflow/types";

const typePresentation = {
  income: {
    label: "Pemasukan",
    sign: "+",
    className: "text-income",
    badgeClassName: "bg-income/10 text-income",
  },
  expense: {
    label: "Pengeluaran",
    sign: "-",
    className: "text-expense",
    badgeClassName: "bg-expense/10 text-expense",
  },
  transfer: {
    label: "Transfer",
    sign: "",
    className: "text-transfer",
    badgeClassName: "bg-transfer/10 text-transfer",
  },
} as const;

export function TransactionList({
  transactions,
}: {
  transactions: CashflowTransactionItem[];
}) {
  if (transactions.length === 0) {
    return (
      <section className="rounded-card border border-dashed border-accent/40 bg-surface p-7 text-center shadow-card">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent-soft text-xl">
          ↕
        </div>
        <h2 className="mt-4 font-bold">Belum ada transaksi</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Mulai catat pemasukan atau pengeluaran pertama kamu.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const presentation = typePresentation[transaction.type];
        const accountCopy =
          transaction.type === "transfer"
            ? `${transaction.accountName} → ${transaction.destinationAccountName}`
            : transaction.accountName;

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
                </div>
                <h2 className="mt-3 truncate font-bold">
                  {transaction.merchant || transaction.categoryName}
                </h2>
                <p className="mt-1 truncate text-sm text-muted">
                  {accountCopy} · {transaction.categoryName}
                </p>
              </div>
              <p
                className={`shrink-0 text-right font-extrabold ${presentation.className}`}
              >
                {presentation.sign}
                {formatIdr(transaction.amount)}
              </p>
            </div>

            {transaction.notes && (
              <p className="mt-3 border-t border-border pt-3 text-sm leading-6 text-muted">
                {transaction.notes}
              </p>
            )}

            <div className="mt-4 flex items-center justify-end gap-4 border-t border-border pt-3">
              <Link
                href={`/cashflow/${transaction.id}/edit`}
                className="text-sm font-bold text-accent-strong"
              >
                Edit
              </Link>
              <form action={deleteTransaction}>
                <input
                  type="hidden"
                  name="transaction_id"
                  value={transaction.id}
                />
                <button className="text-sm font-bold text-expense">
                  Hapus
                </button>
              </form>
            </div>
          </article>
        );
      })}
    </div>
  );
}
