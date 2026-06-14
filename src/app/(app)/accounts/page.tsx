import type { Metadata } from "next";
import Link from "next/link";
import { AccountList } from "@/components/accounts/account-list";
import { PageIntro } from "@/components/ui/page-intro";
import { getSettingsAccounts } from "@/lib/accounts/data";

export const metadata: Metadata = {
  title: "Accounts",
};

export default async function AccountsPage() {
  const result = await getSettingsAccounts();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageIntro
          eyebrow="Mutasi"
          title="Accounts"
          description="Lihat saldo dan riwayat tunai, rekening bank, dan e-wallet."
        />
        <Link
          href="/settings/accounts"
          className="mt-1 inline-flex min-h-11 shrink-0 items-center justify-center rounded-control border border-border px-4 text-sm font-bold text-muted transition hover:border-accent/50 active:scale-[0.98]"
        >
          Kelola
        </Link>
      </div>

      {result.error && (
        <p className="rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {result.error}
        </p>
      )}

      <AccountList accounts={result.accounts} />
    </div>
  );
}
