import Link from "next/link";
import { MoneyText } from "@/components/ui/money-text";
import { formatCompactDateId } from "@/lib/format";
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
  investment_buy: {
    dot: "bg-investment",
    amount: "text-investment",
    sign: "",
  },
  investment_sell: {
    dot: "bg-investment",
    amount: "text-investment",
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
          Belum ada transaksi bulan ini.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          {transactions.map((transaction, index) => {
            const styles = transactionStyles[transaction.type];
            const title =
              transaction.type === "investment_buy" ||
              transaction.type === "investment_sell"
                ? (transaction.assetName ?? transaction.categoryName)
                : transaction.merchant || transaction.categoryName;
            let account = transaction.accountName;

            if (transaction.type === "transfer") {
              account = `${transaction.accountName} → ${transaction.destinationAccountName}`;
            }

            if (transaction.type === "investment_buy") {
              account = `${transaction.accountName} → ${transaction.assetName}`;
            }

            if (transaction.type === "investment_sell") {
              account = `${transaction.assetName} → ${transaction.accountName}`;
            }

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
                    {transaction.adminFeeAmount > 0 && (
                      <p className="mt-1 text-xs font-semibold text-expense">
                        Biaya admin{" "}
                        <MoneyText value={transaction.adminFeeAmount} />
                      </p>
                    )}
                  </div>
                </div>
                <MoneyText
                  as="p"
                  value={transaction.amount}
                  sign={styles.sign}
                  className={`shrink-0 text-sm font-bold ${styles.amount}`}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
