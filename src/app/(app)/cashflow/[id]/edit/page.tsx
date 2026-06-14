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
  searchParams: Promise<{
    return_to?: string | string[];
  }>;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeReturnPath(value: string | undefined): string {
  const rawValue = value ?? "";

  if (rawValue === "/cashflow") {
    return rawValue;
  }

  const accountMatch = rawValue.match(/^\/accounts\/([^/?#]+)$/);

  if (accountMatch && uuidPattern.test(accountMatch[1] ?? "")) {
    return rawValue;
  }

  return "/cashflow";
}

export default async function EditTransactionPage({
  params,
  searchParams,
}: EditTransactionPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const returnPath = safeReturnPath(firstParam(query.return_to));
  const transaction = await getCashflowTransaction(id);
  const options = await getCashflowFormOptions(transaction.categoryId);

  return (
    <>
      <Link
        href={returnPath}
        className="mb-5 inline-flex min-h-11 items-center text-sm font-bold text-muted"
      >
        ← {returnPath.startsWith("/accounts/") ? "Account" : "Cashflow"}
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
          redirectTo={returnPath}
        />
      )}
    </>
  );
}
