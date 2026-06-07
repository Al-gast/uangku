import type { Metadata } from "next";
import Link from "next/link";
import { AccountForm } from "@/components/settings/account-form";
import { AccountList } from "@/components/settings/account-list";
import { getSettingsAccounts } from "@/lib/accounts/data";

export const metadata: Metadata = {
  title: "Akun",
};

type AccountsPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function AccountsPage({
  searchParams,
}: AccountsPageProps) {
  const [{ success, error: queryError }, result] = await Promise.all([
    searchParams,
    getSettingsAccounts(),
  ]);

  return (
    <>
      <Link
        href="/settings"
        className="mb-5 inline-flex min-h-11 items-center text-sm font-bold text-muted"
      >
        ← Settings
      </Link>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Kelola Akun
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
          Akun
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Kelola tunai, rekening bank, dan e-wallet untuk pencatatan cashflow.
        </p>
      </header>

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

      <section className="mb-6 rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="text-lg font-bold">Tambah akun</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Saldo awal akan menjadi saldo saat ini saat akun dibuat.
        </p>
        <div className="mt-4">
          <AccountForm />
        </div>
      </section>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Daftar akun</h2>
        <span className="text-xs font-semibold text-muted">
          {result.accounts.length} akun
        </span>
      </div>
      <AccountList accounts={result.accounts} />
    </>
  );
}
