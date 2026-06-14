import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountMutationFilter } from "@/components/accounts/account-mutation-filter";
import { AccountMutationList } from "@/components/accounts/account-mutation-list";
import { ReconciliationPanel } from "@/components/accounts/reconciliation-panel";
import {
  spendableAccountTypeLabels,
  spendableAccountTypeOptions,
} from "@/constants/accounts";
import {
  accountTransactionLimit,
  countActiveAccountMutationFilters,
  getAccountDetail,
  parseAccountMutationFilters,
} from "@/lib/accounts/data";
import { MoneyText } from "@/components/ui/money-text";
import type {
  AccountMovementSummary,
  AccountMutationFilters,
  AccountNewTransactionType,
  SettingsAccountItem,
} from "@/lib/accounts/types";

export const metadata: Metadata = {
  title: "Detail Account",
};

type AccountDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    success?: string;
    error?: string;
    range?: string | string[];
    type?: string | string[];
  }>;
};

const accountTypeIcons = Object.fromEntries(
  spendableAccountTypeOptions.map((option) => [option.value, option.icon]),
) as Record<SettingsAccountItem["type"], string>;

function newTransactionHref(
  accountId: string,
  type: AccountNewTransactionType,
  returnPath: string,
) {
  const params = new URLSearchParams({
    account: accountId,
    type,
    return_to: returnPath,
  });

  return `/cashflow/new?${params.toString()}`;
}

function accountReturnPath(
  accountId: string,
  filters: AccountMutationFilters,
) {
  const params = new URLSearchParams();

  if (filters.range !== "this_month") {
    params.set("range", filters.range);
  }

  if (filters.type !== "all") {
    params.set("type", filters.type);
  }

  const query = params.toString();

  return query ? `/accounts/${accountId}?${query}` : `/accounts/${accountId}`;
}

function SummaryCard({
  label,
  value,
  tone,
  sign = "",
}: {
  label: string;
  value: number;
  tone: "income" | "expense" | "transfer" | "muted";
  sign?: string;
}) {
  const toneClassName = {
    income: "text-income",
    expense: "text-expense",
    transfer: "text-transfer",
    muted: "text-foreground",
  }[tone];

  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </p>
      <MoneyText
        as="p"
        value={value}
        sign={sign}
        className={`mt-2 text-lg font-extrabold ${toneClassName}`}
      />
    </div>
  );
}

function AccountSummaryGrid({
  summary,
}: {
  summary: AccountMovementSummary;
}) {
  const netIsPositive = summary.netMovement >= 0;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Ringkasan mutasi</h2>
        <span className="text-xs font-semibold text-muted">
          {summary.transactionCount} transaksi
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          label="Total masuk"
          value={summary.totalIn}
          sign="+"
          tone="income"
        />
        <SummaryCard
          label="Total keluar"
          value={summary.totalOut}
          sign="-"
          tone="expense"
        />
        <SummaryCard
          label="Transfer masuk"
          value={summary.transferIn}
          sign="+"
          tone="transfer"
        />
        <SummaryCard
          label="Transfer keluar"
          value={summary.transferOut}
          sign="-"
          tone="transfer"
        />
      </div>
      <div className="mt-3 rounded-card border border-border bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-muted">Net mutasi</span>
          <MoneyText
            value={Math.abs(summary.netMovement)}
            sign={netIsPositive ? "+" : "-"}
            className={`font-extrabold ${
              netIsPositive ? "text-income" : "text-expense"
            }`}
          />
        </div>
        {summary.adminFees > 0 && (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
            <span className="font-semibold text-muted">Biaya admin</span>
            <MoneyText
              value={summary.adminFees}
              sign="-"
              className="font-bold text-expense"
            />
          </div>
        )}
      </div>
    </section>
  );
}

function AccountActions({
  account,
  returnPath,
}: {
  account: SettingsAccountItem;
  returnPath: string;
}) {
  if (!account.isActive) {
    return (
      <section className="rounded-card border border-border bg-surface p-4 text-sm leading-6 text-muted shadow-card">
        Account ini nonaktif. Aktifkan dari Settings untuk mencatat transaksi
        baru.
      </section>
    );
  }

  return (
    <section className="grid grid-cols-3 gap-2">
      <Link
        href={newTransactionHref(account.id, "income", returnPath)}
        className="flex min-h-12 items-center justify-center rounded-control bg-income px-3 text-center text-sm font-bold text-white transition active:scale-[0.98]"
      >
        Pemasukan
      </Link>
      <Link
        href={newTransactionHref(account.id, "expense", returnPath)}
        className="flex min-h-12 items-center justify-center rounded-control bg-expense px-3 text-center text-sm font-bold text-white transition active:scale-[0.98]"
      >
        Pengeluaran
      </Link>
      <Link
        href={newTransactionHref(account.id, "transfer", returnPath)}
        className="flex min-h-12 items-center justify-center rounded-control bg-transfer px-3 text-center text-sm font-bold text-white transition active:scale-[0.98]"
      >
        Transfer
      </Link>
    </section>
  );
}

export default async function AccountDetailPage({
  params,
  searchParams,
}: AccountDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const filters = parseAccountMutationFilters(query);
  const activeFilterCount = countActiveAccountMutationFilters(filters);
  const result = await getAccountDetail(id, filters);

  if (!result.account) {
    if (result.error) {
      return (
        <>
          <Link
            href="/accounts"
            className="mb-5 inline-flex min-h-11 items-center text-sm font-bold text-muted"
          >
            ← Accounts
          </Link>
          <p className="rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
            {result.error}
          </p>
        </>
      );
    }

    notFound();
  }

  const account = result.account;
  const accountTypeLabel = spendableAccountTypeLabels[account.type];
  const returnPath = accountReturnPath(account.id, filters);

  return (
    <div className="space-y-6">
      <Link
        href="/accounts"
        className="inline-flex min-h-11 items-center text-sm font-bold text-muted"
      >
        ← Accounts
      </Link>

      {query.success && (
        <p className="rounded-control border border-income/30 bg-income/10 p-4 text-sm leading-6 text-income">
          {query.success}
        </p>
      )}
      {query.error && (
        <p className="rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {query.error}
        </p>
      )}
      {result.error && (
        <p className="rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {result.error}
        </p>
      )}

      <header className="rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid size-10 place-items-center rounded-2xl bg-accent-soft text-xl">
                {accountTypeIcons[account.type]}
              </span>
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[0.65rem] font-bold text-accent-strong">
                {accountTypeLabel}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${
                  account.isActive
                    ? "bg-income/10 text-income"
                    : "bg-surface-muted text-muted"
                }`}
              >
                {account.isActive ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <h1 className="mt-4 truncate text-3xl font-bold tracking-[-0.035em]">
              {account.name}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Mutasi dan cek manual saldo account.
            </p>
          </div>
          <Link
            href={`/settings/accounts/${account.id}/edit`}
            className="shrink-0 text-sm font-bold text-accent-strong"
          >
            Edit
          </Link>
        </div>

        <div className="mt-6 rounded-card bg-accent p-5 text-accent-foreground">
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">
            Saldo UangKu
          </p>
          <MoneyText
            as="p"
            value={account.currentBalance}
            className="mt-2 text-3xl font-extrabold tracking-[-0.035em]"
          />
          <p className="mt-2 text-xs opacity-80">
            Saldo awal: <MoneyText value={account.initialBalance} />
          </p>
        </div>
      </header>

      <AccountActions account={account} returnPath={returnPath} />

      <ReconciliationPanel currentBalance={account.currentBalance} />

      <AccountSummaryGrid summary={result.summary} />

      <AccountMutationFilter
        accountId={account.id}
        filters={filters}
        activeCount={activeFilterCount}
      />

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Riwayat mutasi</h2>
          <span className="text-xs font-semibold text-muted">
            {result.transactions.length >= accountTransactionLimit
              ? `${accountTransactionLimit} terbaru`
              : `${result.transactions.length} transaksi`}
          </span>
        </div>
        <AccountMutationList
          accountId={account.id}
          accountIsActive={account.isActive}
          returnPath={returnPath}
          transactions={result.transactions}
        />
      </section>
    </div>
  );
}
