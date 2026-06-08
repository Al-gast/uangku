import type { Metadata } from "next";
import Link from "next/link";
import { TransactionForm } from "@/components/cashflow/transaction-form";
import {
  getCashflowFormOptions,
  getCashflowTransaction,
} from "@/lib/cashflow/data";
import { toJakartaDateInput } from "@/lib/format";

export const metadata: Metadata = {
  title: "Edit Transaksi",
};

type EditTransactionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTransactionPage({
  params,
}: EditTransactionPageProps) {
  const { id } = await params;
  const transaction = await getCashflowTransaction(id);
  const options = await getCashflowFormOptions(transaction.categoryId);

  return (
    <>
      <Link
        href="/cashflow"
        className="mb-5 inline-flex min-h-11 items-center text-sm font-bold text-muted"
      >
        ← Cashflow
      </Link>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Perbarui catatan
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
          Edit transaksi
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Saldo lama akan dibalik, lalu perubahan baru diterapkan otomatis.
        </p>
      </header>

      {options.setupError ? (
        <p className="rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {options.setupError}
        </p>
      ) : (
        <TransactionForm
          accounts={options.accounts}
          assets={options.assets}
          liabilities={options.liabilities}
          categories={options.categories}
          defaultDate={toJakartaDateInput()}
          transaction={transaction}
        />
      )}
    </>
  );
}
