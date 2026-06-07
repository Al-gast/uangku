import type { Metadata } from "next";
import { AccountSummary } from "@/components/dashboard/account-summary";
import { DashboardError } from "@/components/dashboard/dashboard-error";
import { EmptyHero, HeroCard } from "@/components/dashboard/hero-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { StatCards } from "@/components/dashboard/stat-cards";
import { PlaceholderCard } from "@/components/ui/placeholder-card";
import { getDashboardData } from "@/lib/dashboard/data";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  const greeting = data.profileName
    ? `Halo, ${data.profileName} 👋`
    : "Halo, selamat datang 👋";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          {data.monthLabel}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
          {greeting}
        </h1>
      </header>

      {data.dashboardError ? (
        <DashboardError />
      ) : (
        <>
          {data.hasMonthlyTransactions ? (
            <HeroCard
              monthLabel={data.monthLabel}
              income={data.monthlyIncome}
              expense={data.monthlyExpense}
            />
          ) : (
            <EmptyHero />
          )}

          <StatCards
            monthLabel={data.monthLabel}
            income={data.monthlyIncome}
            expense={data.monthlyExpense}
          />
        </>
      )}

      <AccountSummary
        accounts={data.accounts}
        error={data.accountError}
      />

      {!data.dashboardError && (
        <RecentTransactions transactions={data.recentTransactions} />
      )}

      <PlaceholderCard
        icon="portfolio"
        title="Portfolio kamu sedang disiapkan"
        description="Ringkasan aset, net worth, dan asset allocation akan hadir di fase berikutnya."
      />
    </div>
  );
}
