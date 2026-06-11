import type { Metadata } from "next";
import Link from "next/link";
import { ActivityCard } from "@/components/insights/activity-card";
import { BudgetHealthCard } from "@/components/insights/budget-health-card";
import { MonthNavigator } from "@/components/insights/month-navigator";
import { MonthlyComparisonCard } from "@/components/insights/monthly-comparison-card";
import { MonthlyProjectionCard } from "@/components/insights/monthly-projection-card";
import { MonthlySummaryCard } from "@/components/insights/monthly-summary-card";
import { RecommendationCard } from "@/components/insights/recommendation-card";
import { TopExpenseCard } from "@/components/insights/top-expense-card";
import { PageIntro } from "@/components/ui/page-intro";
import { getMonthlyReviewData } from "@/lib/insights/data";

export const metadata: Metadata = {
  title: "Rekap Bulanan",
};

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedMonth = Array.isArray(params.month)
    ? params.month[0]
    : params.month;
  const data = await getMonthlyReviewData(requestedMonth);

  return (
    <>
      <PageIntro
        eyebrow={data.monthLabel}
        title="Rekap Bulanan"
        description="Lihat ke mana uangmu pergi dan apa yang perlu diperhatikan."
      />

      <MonthNavigator
        monthKey={data.monthKey}
        monthLabel={data.monthLabel}
        previousMonthKey={data.previousMonthKey}
        nextMonthKey={data.nextMonthKey}
        isCurrentMonth={data.isCurrentMonth}
      />

      {data.error ? (
        <div className="mb-5 rounded-card border border-expense/20 bg-expense/10 p-4 text-sm text-expense">
          {data.error}
        </div>
      ) : null}

      {!data.hasMonthlyTransactions ? (
        <EmptyInsightsState monthLabel={data.monthLabel} />
      ) : (
        <div className="space-y-6">
          <MonthlySummaryCard
            monthLabel={data.monthLabel}
            income={data.monthlyIncome}
            expense={data.monthlyExpense}
            netCashflow={data.netCashflow}
            savingRate={data.savingRate}
          />

          <MonthlyComparisonCard
            comparison={data.comparison}
            monthKey={data.monthKey}
          />

          <MonthlyProjectionCard projection={data.projection} />

          <TopExpenseCard
            categories={data.topExpenseCategories}
            monthKey={data.monthKey}
          />

          <BudgetHealthCard budgets={data.budgetHealth} />

          <ActivityCard
            investment={data.investmentActivity}
            debt={data.debtActivity}
            isCurrentMonth={data.isCurrentMonth}
            monthKey={data.monthKey}
          />

          <RecommendationCard recommendations={data.recommendations} />
        </div>
      )}
    </>
  );
}

function EmptyInsightsState({ monthLabel }: { monthLabel: string }) {
  return (
    <section className="rounded-card border border-dashed border-accent/30 bg-surface p-6 text-center shadow-card">
      <h2 className="text-lg font-bold">Belum ada data {monthLabel}.</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
        Catat transaksi pertama lewat form cashflow atau chat agar rekap bulanan
        bisa dihitung.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/cashflow/new"
          className="inline-flex min-h-11 items-center justify-center rounded-control bg-accent px-5 text-sm font-bold text-accent-foreground"
        >
          Catat transaksi
        </Link>
        <Link
          href="/chat"
          className="inline-flex min-h-11 items-center justify-center rounded-control border border-border bg-surface px-5 text-sm font-bold"
        >
          Buka Chat
        </Link>
      </div>
    </section>
  );
}
