import type { Metadata } from "next";
import Link from "next/link";
import { TransactionList } from "@/components/cashflow/transaction-list";
import { PageIntro } from "@/components/ui/page-intro";
import { getCashflowTransactions } from "@/lib/cashflow/data";

export const metadata: Metadata = {
  title: "Cashflow",
};

type CashflowPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function CashflowPage({
  searchParams,
}: CashflowPageProps) {
  const [{ success, error: queryError }, result] = await Promise.all([
    searchParams,
    getCashflowTransactions(),
  ]);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageIntro
          eyebrow="Transaksi"
          title="Cashflow"
          description="Catat pemasukan, pengeluaran, dan perpindahan uang antar akun."
        />
        <Link
          href="/cashflow/new"
          aria-label="Tambah transaksi"
          className="mt-1 grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-2xl font-light text-accent-foreground shadow-card transition hover:bg-accent-strong active:scale-[0.96]"
        >
          +
        </Link>
      </div>

      {success && (
        <p className="mb-5 rounded-control border border-income/30 bg-income/10 p-4 text-sm leading-6 text-income">
          {success}
        </p>
      )}
      {(queryError || result.error) && (
        <p className="mb-5 rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {queryError || result.error}
        </p>
      )}

      <section className="mb-5 rounded-card border border-border bg-surface p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Ringkasan
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Ringkasan cashflow bulanan akan hadir pada fase Dashboard. Untuk
          sekarang, fokusnya pencatatan transaksi yang akurat.
        </p>
      </section>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Transaksi terbaru</h2>
        <span className="text-xs font-semibold text-muted">
          {result.transactions.length} transaksi
        </span>
      </div>
      <TransactionList transactions={result.transactions} />
    </>
  );
}
