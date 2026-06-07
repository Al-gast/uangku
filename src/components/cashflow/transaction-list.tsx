import Link from "next/link";
import { deleteTransaction } from "@/app/(app)/cashflow/actions";
import { MoneyText } from "@/components/ui/money-text";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import { formatDateId } from "@/lib/format";
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
  investment_buy: {
    label: "Top up investasi",
    sign: "",
    className: "text-investment",
    badgeClassName: "bg-investment/10 text-investment",
  },
  investment_sell: {
    label: "Tarik investasi",
    sign: "",
    className: "text-investment",
    badgeClassName: "bg-investment/10 text-investment",
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
        <Link
          href="/cashflow/new"
          className="mt-4 inline-flex min-h-11 items-center rounded-control bg-accent px-5 text-sm font-bold text-accent-foreground transition active:scale-[0.98]"
        >
          + Catat Transaksi
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const presentation = typePresentation[transaction.type];
        let accountCopy = transaction.accountName;

        if (transaction.type === "transfer") {
          accountCopy = `${transaction.accountName} → ${transaction.destinationAccountName}`;
        }

        if (transaction.type === "investment_buy") {
          accountCopy = `${transaction.accountName} → ${transaction.assetName}`;
        }

        if (transaction.type === "investment_sell") {
          accountCopy = `${transaction.assetName} → ${transaction.accountName}`;
        }

        const title =
          transaction.type === "investment_buy" ||
          transaction.type === "investment_sell"
            ? (transaction.assetName ?? transaction.categoryName)
            : transaction.merchant || transaction.categoryName;

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
                <h2 className="mt-3 truncate font-bold">{title}</h2>
                <p className="mt-1 truncate text-sm text-muted">
                  {accountCopy} · {transaction.categoryName}
                </p>
              </div>
              <MoneyText
                as="p"
                value={transaction.amount}
                sign={presentation.sign}
                className={`shrink-0 text-right font-extrabold ${presentation.className}`}
              />
            </div>

            {transaction.notes && (
              <p className="mt-3 border-t border-border pt-3 text-sm leading-6 text-muted">
                {transaction.notes}
              </p>
            )}

            {transaction.adminFeeAmount > 0 && (
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
                <span className="font-semibold text-muted">
                  {transaction.adminFeeCategoryName ?? "Biaya Admin"}
                </span>
                <MoneyText
                  value={transaction.adminFeeAmount}
                  className="font-bold text-expense"
                />
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-4 border-t border-border pt-3">
              <Link
                href={`/cashflow/${transaction.id}/edit`}
                className="text-sm font-bold text-accent-strong"
              >
                Edit
              </Link>
              <ConfirmActionForm
                submitAction={deleteTransaction}
                fields={[
                  { name: "transaction_id", value: transaction.id },
                ]}
                buttonLabel="Hapus"
                title="Hapus transaksi ini?"
                description="Saldo akun akan dikembalikan sesuai efek transaksi ini."
                confirmLabel="Hapus Transaksi"
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
