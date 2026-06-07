import Link from "next/link";
import { formatCompactDateId, formatIdr } from "@/lib/format";
import type { CashflowTransactionItem } from "@/lib/cashflow/types";

const transactionStyles = {
  income: {
    dot: "bg-income",
    amount: "text-income",
    sign: "+",
  },
  expense: {
    dot: "bg-expense",
    amount: "text-expense",
    sign: "-",
  },
  transfer: {
    dot: "bg-transfer",
    amount: "text-transfer",
    sign: "",
  },
} as const;

export function RecentTransactions({
  transactions,
}: {
  transactions: CashflowTransactionItem[];
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">Transaksi Terakhir</h2>
        <Link
          href="/cashflow"
          className="shrink-0 text-sm font-bold text-accent-strong"
        >
          Lihat semua
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-5 text-sm leading-6 text-muted shadow-card">
          Belum ada transaksi untuk ditampilkan.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          {transactions.map((transaction, index) => {
            const styles = transactionStyles[transaction.type];
            const title =
              transaction.merchant || transaction.categoryName;
            const account =
              transaction.type === "transfer"
                ? `${transaction.accountName} → ${transaction.destinationAccountName}`
                : transaction.accountName;

            return (
              <div
                key={transaction.id}
                className={`flex items-start justify-between gap-4 p-4 ${
                  index > 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${styles.dot}`}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{title}</p>
                    <p className="mt-1 truncate text-xs text-muted">
                      {account} ·{" "}
                      {formatCompactDateId(transaction.transactionDate)}
                    </p>
                  </div>
                </div>
                <p
                  className={`shrink-0 text-sm font-bold ${styles.amount}`}
                >
                  {styles.sign}
                  {formatIdr(transaction.amount)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
