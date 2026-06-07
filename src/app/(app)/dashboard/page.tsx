import type { Metadata } from "next";
import { AccountSummary } from "@/components/dashboard/account-summary";
import { BudgetSummary } from "@/components/dashboard/budget-summary";
import { DashboardError } from "@/components/dashboard/dashboard-error";
import { EmptyHero, HeroCard } from "@/components/dashboard/hero-card";
import { DashboardPortfolioSummary } from "@/components/dashboard/portfolio-summary";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { StatCards } from "@/components/dashboard/stat-cards";
import { PrivacyToggle } from "@/components/settings/privacy-toggle";
import { getCurrentMonthBudgets } from "@/lib/budgets/data";
import { getDashboardData } from "@/lib/dashboard/data";
import { getPortfolioSummary } from "@/lib/portfolio/data";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const [data, budgetResult, portfolioSummary] = await Promise.all([
    getDashboardData(),
    getCurrentMonthBudgets(),
    getPortfolioSummary(),
  ]);
  const greeting = data.profileName
    ? `Halo, ${data.profileName} 👋`
    : "Halo, selamat datang 👋";

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {data.monthLabel}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
            {greeting}
          </h1>
        </div>
        <PrivacyToggle compact />
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

      <BudgetSummary
        budgets={budgetResult.budgets}
        error={budgetResult.error}
      />

      {!data.dashboardError && (
        <RecentTransactions transactions={data.recentTransactions} />
      )}

      <DashboardPortfolioSummary summary={portfolioSummary} />
    </div>
  );
}
