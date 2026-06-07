import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountForm } from "@/components/settings/account-form";
import { getSettingsAccounts } from "@/lib/accounts/data";

export const metadata: Metadata = {
  title: "Edit Akun",
};

type EditAccountPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAccountPage({
  params,
}: EditAccountPageProps) {
  const { id } = await params;
  const result = await getSettingsAccounts();
  const account = result.accounts.find((item) => item.id === id);

  if (!account) {
    notFound();
  }

  return (
    <>
      <Link
        href="/settings/accounts"
        className="mb-5 inline-flex text-sm font-bold text-muted"
      >
        ← Accounts
      </Link>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Perbarui akun
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
          Edit akun
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Ubah nama atau jenis akun tanpa mengubah saldo dan riwayat transaksi.
        </p>
      </header>

      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <AccountForm account={account} />
      </section>
    </>
  );
}
