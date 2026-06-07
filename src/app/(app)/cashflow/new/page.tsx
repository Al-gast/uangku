import type { Metadata } from "next";
import Link from "next/link";
import { TransactionForm } from "@/components/cashflow/transaction-form";
import { getCashflowFormOptions } from "@/lib/cashflow/data";
import { toJakartaDateInput } from "@/lib/format";

export const metadata: Metadata = {
  title: "Tambah Transaksi",
};

export default async function NewTransactionPage() {
  const { accounts, assets, liabilities, categories, setupError } =
    await getCashflowFormOptions();

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
          Catat manual
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
          Tambah transaksi
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Isi yang penting dulu. Detail tambahan boleh dikosongkan.
        </p>
      </header>

      {setupError ? (
        <p className="rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {setupError}
        </p>
      ) : (
        <TransactionForm
          accounts={accounts}
          assets={assets}
          liabilities={liabilities}
          categories={categories}
          defaultDate={toJakartaDateInput()}
        />
      )}
    </>
  );
}
