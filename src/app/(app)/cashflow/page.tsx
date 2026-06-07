import type { Metadata } from "next";
import Link from "next/link";
import { CashflowFilterPanel } from "@/components/cashflow/filter-panel";
import { TransactionList } from "@/components/cashflow/transaction-list";
import { PageIntro } from "@/components/ui/page-intro";
import {
  countActiveCashflowFilters,
  getCashflowFilterOptions,
  getCashflowTransactions,
  parseCashflowFilters,
} from "@/lib/cashflow/data";

export const metadata: Metadata = {
  title: "Cashflow",
};

type CashflowPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
    type?: string | string[];
    account?: string | string[];
    category?: string | string[];
    source?: string | string[];
    range?: string | string[];
  }>;
};

export default async function CashflowPage({
  searchParams,
}: CashflowPageProps) {
  const params = await searchParams;
  const filters = parseCashflowFilters(params);
  const activeFilterCount = countActiveCashflowFilters(filters);
  const [result, filterOptions] = await Promise.all([
    getCashflowTransactions(filters),
    getCashflowFilterOptions(),
  ]);
  const { success, error: queryError } = params;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageIntro
          eyebrow="Transaksi"
          title="Cashflow"
          description="Catat pemasukan, pengeluaran, transfer, investasi, dan pembayaran hutang."
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
        <p className="rounded-control border border-income/30 bg-income/10 p-4 text-sm leading-6 text-income">
          {success}
        </p>
      )}
      {(queryError || result.error) && (
        <p className="rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {queryError || result.error}
        </p>
      )}

      <section className="rounded-card border border-border bg-surface p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Ringkasan
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Investasi dicatat sebagai perpindahan nilai, bukan pengeluaran
          konsumtif. Pembayaran pokok hutang juga tidak memengaruhi budget;
          biaya atau bunga tetap dihitung sebagai pengeluaran.
        </p>
      </section>

      <CashflowFilterPanel
        filters={filters}
        accounts={filterOptions.accounts}
        categories={filterOptions.categories}
        activeCount={activeFilterCount}
      />

      {filterOptions.error && (
        <p className="text-sm text-muted">{filterOptions.error}</p>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Transaksi terbaru</h2>
          <span className="text-xs font-semibold text-muted">
            {result.transactions.length} transaksi
          </span>
        </div>
        <TransactionList
          transactions={result.transactions}
          filtered={activeFilterCount > 0}
        />
      </div>
    </div>
  );
}
