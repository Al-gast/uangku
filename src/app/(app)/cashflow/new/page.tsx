import type { Metadata } from "next";
import Link from "next/link";
import { TransactionForm } from "@/components/cashflow/transaction-form";
import { getCashflowFormOptions } from "@/lib/cashflow/data";
import type { ManualTransactionType } from "@/lib/cashflow/types";
import { toJakartaDateInput } from "@/lib/format";

export const metadata: Metadata = {
  title: "Tambah Transaksi",
};

type NewTransactionPageProps = {
  searchParams: Promise<{
    account?: string | string[];
    type?: string | string[];
    return_to?: string | string[];
  }>;
};

const manualTransactionTypes: ManualTransactionType[] = [
  "income",
  "expense",
  "transfer",
  "investment_buy",
  "investment_sell",
  "debt_payment",
];
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseInitialType(value: string | undefined) {
  return manualTransactionTypes.includes(value as ManualTransactionType)
    ? (value as ManualTransactionType)
    : undefined;
}

function safeReturnPath(
  value: string | undefined,
  accountId?: string,
): string {
  const rawValue = value ?? "";

  if (rawValue === "/cashflow") {
    return rawValue;
  }

  const accountMatch = rawValue.match(/^\/accounts\/([^/?#]+)$/);

  if (accountMatch && uuidPattern.test(accountMatch[1] ?? "")) {
    return rawValue;
  }

  return accountId && uuidPattern.test(accountId)
    ? `/accounts/${accountId}`
    : "/cashflow";
}

export default async function NewTransactionPage({
  searchParams,
}: NewTransactionPageProps) {
  const params = await searchParams;
  const requestedAccountId = firstParam(params.account);
  const initialAccountId =
    requestedAccountId && uuidPattern.test(requestedAccountId)
      ? requestedAccountId
      : undefined;
  const initialType = parseInitialType(firstParam(params.type));
  const redirectTo = safeReturnPath(
    firstParam(params.return_to),
    initialAccountId,
  );
  const { accounts, assets, liabilities, categories, setupError } =
    await getCashflowFormOptions();

  return (
    <>
      <Link
        href={redirectTo}
        className="mb-5 inline-flex min-h-11 items-center text-sm font-bold text-muted"
      >
        ← {redirectTo.startsWith("/accounts/") ? "Account" : "Cashflow"}
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
          initialType={initialType}
          initialAccountId={initialAccountId}
          redirectTo={redirectTo}
        />
      )}
    </>
  );
}
